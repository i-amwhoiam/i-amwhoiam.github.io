(function () {
  var CONFIG_KEY = "bilingual-study-cloud-config-v1";
  var client = null;
  var currentUser = null;
  var uploadTimer = null;
  var pollTimer = null;
  var initialized = false;

  function getConfig() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function setStatus(message, kind) {
    if (window.setCloudStatus) window.setCloudStatus(message, kind || "");
  }

  function getErrorMessage(error) {
    return error && error.message ? error.message : String(error || "未知错误");
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(function () {
      if (currentUser) loadRemote();
    }, 30000);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  async function init() {
    var config = getConfig();
    if (!config.url || !config.anonKey) {
      setStatus("未配置云同步，当前使用本地保存。", "muted");
      return;
    }
    if (!window.supabase || !window.supabase.createClient) {
      setStatus("同步组件未加载，请联网后刷新页面。", "bad");
      return;
    }
    try {
      client = window.supabase.createClient(config.url, config.anonKey);
      initialized = true;
      var sessionResult = await client.auth.getSession();
      currentUser = sessionResult.data && sessionResult.data.session ? sessionResult.data.session.user : null;
      if (currentUser) {
        await loadRemote();
        startPolling();
      }
      else setStatus("云同步已配置，请登录。", "muted");
      client.auth.onAuthStateChange(function (event, session) {
        currentUser = session ? session.user : null;
        if (currentUser) {
          setStatus("已登录，正在同步...", "pending");
          setTimeout(function () { loadRemote(); startPolling(); }, 0);
        } else {
          stopPolling();
          setStatus("已退出云同步，当前使用本地保存。", "muted");
        }
      });
    } catch (e) {
      setStatus("云同步初始化失败：" + getErrorMessage(e), "bad");
    }
  }

  async function configure(url, anonKey) {
    url = String(url || "").trim().replace(/\/$/, "");
    anonKey = String(anonKey || "").trim();
    if (!url || !anonKey) {
      setStatus("请填写 Supabase URL 和 anon key。", "bad");
      return false;
    }
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ url: url, anonKey: anonKey }));
    client = null;
    currentUser = null;
    initialized = false;
    await init();
    return true;
  }

  async function signUp(email, password) {
    if (!client) {
      setStatus("请先保存 Supabase 配置。", "bad");
      return;
    }
    try {
      var result = await client.auth.signUp({ email: String(email || "").trim(), password: password || "" });
      if (result.error) throw result.error;
      if (result.data.session) setStatus("注册并登录成功，正在同步。", "good");
      else setStatus("注册成功，请先查收邮箱完成验证。", "pending");
    } catch (e) {
      setStatus("注册失败：" + getErrorMessage(e), "bad");
    }
  }

  async function signIn(email, password) {
    if (!client) {
      setStatus("请先保存 Supabase 配置。", "bad");
      return;
    }
    try {
      var result = await client.auth.signInWithPassword({ email: String(email || "").trim(), password: password || "" });
      if (result.error) throw result.error;
      currentUser = result.data.user;
      await loadRemote();
      startPolling();
    } catch (e) {
      setStatus("登录失败：" + getErrorMessage(e), "bad");
    }
  }

  async function signOut() {
    if (!client) return;
    try {
      var result = await client.auth.signOut();
      if (result.error) throw result.error;
      currentUser = null;
      stopPolling();
      setStatus("已退出云同步，当前设备仍保留本地数据。", "muted");
    } catch (e) {
      setStatus("退出失败：" + getErrorMessage(e), "bad");
    }
  }

  async function loadRemote() {
    if (!initialized || !client || !currentUser) return;
    try {
      var result = await client
        .from("study_states")
        .select("payload,updated_at")
        .eq("user_id", currentUser.id)
        .maybeSingle();
      if (result.error) throw result.error;
      if (result.data && result.data.payload) {
        if (window.applyCloudState) window.applyCloudState(result.data.payload);
        setStatus("已同步：" + new Date(result.data.updated_at).toLocaleString(), "good");
      } else {
        await uploadNow(window.getCloudState ? window.getCloudState() : null);
      }
    } catch (e) {
      setStatus("读取云端数据失败：" + getErrorMessage(e), "bad");
    }

  }

  async function uploadNow(state) {
    if (!initialized || !client || !currentUser || !state) return false;
    try {
      var updatedAt = new Date().toISOString();
      state.updatedAt = updatedAt;
      var result = await client.from("study_states").upsert({
        user_id: currentUser.id,
        payload: state,
        updated_at: updatedAt
      }, { onConflict: "user_id" });
      if (result.error) throw result.error;
      setStatus("已同步：" + new Date(updatedAt).toLocaleString(), "good");
      return true;
    } catch (e) {
      setStatus("上传云端失败：" + getErrorMessage(e), "bad");
      return false;
    }
  }

  function queueUpload(state) {
    if (!initialized || !client || !currentUser || !state) return;
    clearTimeout(uploadTimer);
    setStatus("正在等待同步...", "pending");
    uploadTimer = setTimeout(function () { uploadNow(state); }, 800);
  }

  window.cloudSync = {
    init: init,
    configure: configure,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    syncNow: function () { return loadRemote(); },
    queueUpload: queueUpload,
    isLoggedIn: function () { return !!currentUser; },
    getConfig: getConfig
  };
})();
