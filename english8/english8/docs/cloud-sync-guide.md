# 中英文学习工具：部署、使用与电脑手机同步

这份说明适合第一次使用 Supabase、第一次把网页发布到 GitHub Pages 的用户。

本项目有两种运行方式：

- **本地模式**：直接双击 HTML 文件即可使用，数据保存在当前浏览器，不需要注册账号。
- **云同步模式**：网页仍然是静态网页，使用 Supabase 保存数据；电脑和手机登录同一个账号后，可以同步题库、默写记录、错题和默写类型。

云同步是可选功能。不配置 Supabase 时，学习、导入、导出和本地记录仍然可以正常使用。

## 一、文件说明

请将下面这些文件放在同一个文件夹中：

| 文件 | 作用 |
| --- | --- |
| index.html | GitHub Pages 默认首页，打开后进入学习工具 |
| all-in-one.html | 本地推荐入口，会跳转到 study-tool.html |
| study-tool.html | 完整学习工具 |
| cloud-sync.js | Supabase 云同步模块，必须和网页放在同一目录 |
| supabase-sync.sql | 创建云端数据表和安全策略，只需要在 Supabase 执行一次 |
| study-tool.md | 功能、数据格式和导入导出说明 |
| README.md | 项目总览 |

不要删除 cloud-sync.js。如果只上传 study-tool.html，云同步按钮虽然还在，但同步模块无法加载。

## 二、先在本地使用

### 1. 打开工具

在文件夹中双击 all-in-one.html，或者直接双击 study-tool.html。

网页打开后，即使没有配置 Supabase，也可以完成全部本地功能。

### 2. 输入题库

在输入框中每行输入一组英文和中文，中间使用英文半角竖线 |：

~~~text
Hello! Nice to meet you. | 你好！很高兴认识你。
Let me introduce myself. | 让我介绍一下自己。
I think software testing is important. | 我认为软件测试很重要。
~~~

然后点击“生成内容”。

注意：

- 一行代表一道题。
- 英文和中文之间使用英文半角 |，不要使用中文全角 ｜。
- 中文内容中即使还有 |，程序也会把第一个 | 当成分隔符。
- 建议每行只放一组英文和中文，便于后面查看记录和错题。

### 3. 选择默写类型

工具支持三种类型：

- **听英文默写英文**：播放英文，只填写听到的英文。
- **看中文默写英文**：显示中文，填写英文。
- **看英文默写中文**：显示英文，填写中文。

可以打开“下一题自动提交”。开启后，点击“下一题”会先自动提交当前答案，再进入下一题。

答案判定会忽略大小写、常见标点、标点后的空格以及英文缩写撇号的常见差异。例如：

~~~text
正确答案：Hello! Nice to meet you. Let me introduce myself.
你的答案：hello,nice to meet you.let me introduce myself
~~~

这类答案会按规则判定为通过。如果仍然需要调整，可以在当前结果或历史记录中手动改成“通过”或“不通过”，也可以恢复“默认判定”。

### 4. 保存或退出默写

默写过程中点击“退出默写”后，可以选择：

- **保存本轮**：保存已经提交的答案。
- **放弃本轮**：不保存本轮已提交答案。
- **继续默写**：返回当前默写。

没有点击“提交答案”的输入内容不会进入记录。

同一轮中，同一道题只保留一条记录。重做同一题会覆盖这一轮原来的记录，不会生成两个“第一题”。

### 5. 查看错题

在“错题复习”中可以：

- 按关键词、默写类型、轮次和题目筛选。
- 单独复习某一道错题。
- 批量复习当前筛选出的错题。
- 读英文、读中文、复制本行或删除错题。
- 让复习优先沿用这道题之前做错时的默写类型。

导入的错题会作为新的最新错题轮次，同时保留每道题的原默写类型。

### 6. 导入与导出

在“数据管理与共享”中：

- **共享题库 JSON**：只包含题目，适合发给别人，不包含个人答题记录。
- **完整备份 JSON**：包含题库、练习记录、错题、人工判定、默写类型和设置，适合换设备或备份。
- **本轮记录 / 全部记录**：分别导出当前练习轮次或全部练习历史。
- **本轮错题 / 全部错题**：分别导出当前轮次错题或所有错题。
- **TXT**：适合阅读、打印和重新导入题库。

导出文件会自动带有导出日期和时间。重要数据建议定期导出一份完整备份。

导入时先选择“合并导入”或“覆盖恢复”，查看预览后再点击“确认导入”：

- **合并导入**：保留当前内容，并把文件内容合并进来。
- **覆盖恢复**：用备份文件替换当前题库和记录，适合恢复旧数据。

如果是跨设备带入错题，推荐导出和导入错题 JSON；导入后会成为新的最新错题轮次。

## 三、发布到 GitHub Pages

GitHub Pages 可以把这个静态网页发布成一个手机和电脑都能打开的网址，不需要购买服务器。

### 方案 A：网页上传文件

适合第一次使用 GitHub。

#### 1. 注册 GitHub

打开 https://github.com/：

1. 点击 Sign up 注册账号。
2. 使用邮箱完成验证。
3. 登录 GitHub。

GitHub 账号和 Supabase 账号可以使用不同邮箱，但后面要记住 Supabase 的同步账号邮箱和密码。

#### 2. 创建仓库

1. 点击右上角 +。
2. 选择 New repository。
3. 填写仓库名，例如 bilingual-study-tool。
4. 选择 Public，这样最容易使用 GitHub Pages。
5. 点击 Create repository。

仓库名尽量只使用英文字母、数字和短横线，不要使用空格或中文。

#### 3. 上传项目文件

进入刚创建的仓库，点击 Add file -> Upload files，上传至少这些文件：

- index.html
- study-tool.html
- cloud-sync.js
- all-in-one.html
- supabase-sync.sql
- README.md
- study-tool.md
- cloud-sync-guide.md

上传后点击页面下方的 Commit changes。

文件必须直接放在仓库最外层，不能放在额外的子文件夹中。上传后，点击 index.html 应该可以看到文件内容。

#### 4. 开启 GitHub Pages

1. 打开仓库的 Settings。
2. 左侧找到 Pages。
3. 在 Build and deployment 的 Source 中选择 Deploy from a branch。
4. 分支选择 main，目录选择 / (root)。
5. 点击 Save。
6. 等待几十秒到几分钟。

页面会显示一个网址，通常类似：

~~~text
https://你的用户名.github.io/仓库名/
~~~

打开这个网址。如果能看到“中英文学习工具”，说明网页部署成功。

之后修改网页文件，只要重新上传并提交，GitHub Pages 会自动重新发布。

### 方案 B：使用 Git 命令

如果电脑已经安装 Git，可以在项目文件夹中执行：

~~~powershell
git init
git add .
git commit -m "发布中英文学习工具"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
~~~

然后仍然要到仓库的 Settings -> Pages 开启 GitHub Pages。

如果不熟悉 Git，使用上面的网页上传方式即可。

### 重要：GitHub Pages 与文件位置

index.html 是 GitHub Pages 默认打开的文件。它会跳转到同目录下的 study-tool.html，所以以下两个文件必须同时存在：

- index.html
- study-tool.html

study-tool.html 又会加载同目录下的 cloud-sync.js，所以 cloud-sync.js 也必须在同一层。

## 四、注册 Supabase

Supabase 是保存同步数据的云服务。项目使用的是它的免费基础能力和登录功能。

### 1. 打开注册页面

打开 https://supabase.com/，点击 Start your project 或 Sign in。

可以使用 GitHub 登录，也可以使用邮箱注册。第一次使用时，推荐直接点击 Continue with GitHub，这样少记一个密码。

如果使用邮箱注册：

1. 输入邮箱。
2. 设置 Supabase 登录密码。
3. 查收验证邮件并完成验证。
4. 返回 Supabase 登录。

注意：Supabase 登录账号是“管理 Supabase 项目”的账号；学习工具里面还要另外注册一个“同步账号”。两个账号可以使用同一个邮箱，但它们不是同一个密码系统。

### 2. 创建组织

第一次登录可能会要求创建 Organization：

1. 填写组织名称，例如 My Study。
2. 选择个人使用或免费计划。
3. 继续下一步。

组织只是 Supabase 中用来管理项目的容器。

### 3. 创建项目

进入 Supabase 控制台后：

1. 点击 New project。
2. 选择刚创建的组织。
3. 填写项目名称，例如 bilingual-study。
4. 设置一个数据库密码并保存好。
5. 选择离自己较近的地区。
6. 选择免费计划。
7. 点击 Create new project。

创建项目通常需要等待一会儿。等项目状态变成可用后再继续。

数据库密码是 Supabase 管理数据库使用的密码，本网页不会使用它，也不要把它写入 HTML。

## 五、在 Supabase 创建同步表

这一步只需要对每个 Supabase 项目执行一次。

### 1. 打开 SQL Editor

在 Supabase 项目左侧菜单找到 SQL Editor：

1. 点击 SQL Editor。
2. 点击 New query。
3. 打开项目文件夹中的 supabase-sync.sql。
4. 复制该文件的全部内容。
5. 粘贴到 Supabase 的 SQL 编辑框。
6. 点击 Run。

当前 SQL 文件内容的作用是：

- 创建 public.study_states 表。
- 每个同步账号只保存一条自己的状态数据。
- 启用 Row Level Security，简称 RLS。
- 只允许用户读取、插入和修改自己的 user_id 数据。

看到执行成功后，打开左侧 Table Editor，应该能看到 study_states 表。

### 2. 不要跳过 RLS

RLS 是数据安全规则。没有它，网页中的公开 anon key 可能无法正确限制数据访问。

本项目的 SQL 已经创建了三条策略：

- 只能读取自己的记录。
- 只能插入自己的记录。
- 只能修改自己的记录。

不要为了“解决报错”而关闭 RLS，也不要把 service_role key 放到网页中。

## 六、检查 Supabase 邮箱登录

在 Supabase 项目左侧打开：

Authentication -> Providers -> Email

确认 Email provider 已启用。

建议保持邮箱验证开启。这样新注册的同步账号必须先点击邮箱里的验证链接，之后才能登录。

如果暂时收不到验证邮件：

- 查看垃圾邮件或广告邮件文件夹。
- 检查邮箱地址是否填写正确。
- 等待几分钟后重新发送。
- 不要连续快速点击注册，避免触发限制。

免费项目的邮件发送能力可能有限。如果长期收不到邮件，可以在 Supabase 的 Authentication 设置中检查邮件服务配置，或者先确认登录时是否提示“邮箱未验证”。

## 七、找到网页需要的 URL 和公钥

在 Supabase 项目中打开：

Project Settings -> API

找到以下两个值：

### 1. Project URL

类似：

~~~text
https://abcdefghijkl.supabase.co
~~~

复制完整的 Project URL，粘贴到学习工具的“Supabase Project URL”输入框。

### 2. anon public key 或 publishable key

不同版本的 Supabase 控制台名称可能不同：

- 旧版通常显示 anon public key。
- 新版可能显示 Publishable key，通常以 sb_publishable_ 开头。

按照页面提示复制可用于浏览器客户端的公开 key，粘贴到“Supabase anon public key”输入框。

只能使用公开客户端 key。以下内容绝对不能放入网页、GitHub 仓库或截图：

- service_role key。
- Secret key。
- 数据库密码。
- Supabase 管理员密码。

网页中的公开 key 本身不是用户密码，真正的隔离依赖数据库 RLS 和用户登录身份。

## 八、配置 GitHub Pages 地址

为了让邮箱验证链接返回到你的网页，建议配置站点地址。

在 Supabase 中打开：

Authentication -> URL Configuration

填写：

### Site URL

填写 GitHub Pages 首页地址，例如：

~~~text
https://你的用户名.github.io/bilingual-study-tool/
~~~

注意最后的 / 建议保留。

### Redirect URLs

增加下面的地址：

~~~text
https://你的用户名.github.io/bilingual-study-tool/
https://你的用户名.github.io/bilingual-study-tool/index.html
~~~

点击保存。

如果以后换了仓库名、绑定了自定义域名或改了网页地址，要回到这里同步修改 URL。Supabase 的 URL 区分域名和路径，少一个字符都可能导致验证链接跳转失败。

本地双击打开时地址是 file:///...，它不是稳定的网站地址。云同步最推荐使用已经发布的 GitHub Pages 地址。

## 九、在学习工具中开启云同步

先打开 GitHub Pages 网页，或者在联网状态下打开本地 study-tool.html。

### 第一次配置电脑

1. 打开“数据管理”。
2. 找到“电脑 / 手机自动同步”。
3. 把 Supabase 的 Project URL 粘贴到第一个输入框。
4. 把公开客户端 key 粘贴到第二个输入框。
5. 点击“保存云配置”。
6. 等待状态变成“云同步已配置，请登录”。
7. 输入准备作为同步账号的邮箱和密码。
8. 点击“注册同步账号”。
9. 查收验证邮件并点击验证链接。
10. 回到学习工具，再点击“登录同步账号”。

注册同步账号的密码是学习工具自己的登录密码，不是 Supabase 控制台密码。

如果注册后直接显示“注册并登录成功”，说明项目没有要求邮箱验证，可以直接继续使用。如果显示“注册成功，请先查收邮箱完成验证”，必须先完成邮件验证。

### 第一次配置手机

1. 用手机浏览器打开同一个 GitHub Pages 地址。
2. 进入“数据管理”。
3. 再次填写同一个 Supabase Project URL 和公开客户端 key。
4. 点击“保存云配置”。
5. 输入和电脑完全相同的同步账号邮箱、密码。
6. 点击“登录同步账号”。

配置不会自动从电脑传到手机，因为 URL 和 key 保存在每台设备自己的浏览器中；但配置一次后，登录数据会通过云端同步。

### 如何确认同步成功

页面状态出现类似下面的文字，表示已经成功：

~~~text
已同步：2026/7/17 22:30:00
~~~

在电脑上新增题目、提交答案或修改记录后，等待状态更新；然后在手机打开页面或点击“立即同步”。

自动同步规则：

- 本地保存后会自动排队上传。
- 页面打开期间大约每 30 秒检查一次云端更新。
- 点击“立即同步”可以手动读取云端。
- 退出同步账号后，当前设备仍保留本地数据，但不再上传或读取云端。

## 十、首次同步时的数据合并

如果电脑本地已经有题库和练习记录，第一次登录云账号时，程序会把当前设备内容和云端内容合并：

- 题库会去重合并。
- 练习记录按“同一轮 + 同一道题”去重。
- 同一轮同一道题重复作答时，较新的记录保留。
- 错题会保留题目和默写类型。
- 题库名称、备注和练习设置会一并同步。

第一次配置云同步前，建议先在“数据管理”中导出“完整备份 JSON”。这样即使选错账号或导入结果不符合预期，也可以使用“覆盖恢复”还原。

如果电脑和手机同时修改同一道题，建议先让一台设备同步完成，再在另一台设备点击“立即同步”后继续修改。不要在两台设备同时连续编辑同一轮，否则最后保存的状态可能覆盖另一台设备刚刚做出的修改。

## 十一、推荐的日常使用流程

### 新建题库

1. 在输入框粘贴多行 英文 | 中文。
2. 填写题库名称和备注。
3. 点击“生成内容”。
4. 在句库中检查英文、中文和朗读功能。
5. 导出一份“共享题库 JSON”或“完整备份 JSON”。

### 进行默写

1. 选择默写类型。
2. 根据需要开启“下一题自动提交”。
3. 开始练习。
4. 对自动判定不满意时，手动改为通过或不通过。
5. 完成本轮后退出并选择“保存本轮”。

### 复习错题

1. 打开“错题复习”。
2. 按默写类型、轮次或题目筛选。
3. 选择单题复习或批量复习。
4. 复习时程序优先使用这道题之前的默写类型。
5. 复习通过后，错题状态会相应更新。

### 备份和换设备

1. 在旧设备导出“完整备份 JSON”。
2. 在新设备配置 Supabase 并登录同一个账号。
3. 等待云端同步完成。
4. 如果只需要迁移一次，也可以在新设备导入完整备份。
5. 导入后检查题目数量、记录数量和错题数量。

## 十二、常见问题

### 1. 页面显示“同步组件未加载”

检查：

- 设备是否联网。
- 浏览器是否拦截了 jsDelivr CDN。
- cloud-sync.js 是否与 study-tool.html 在同一目录。
- 是否直接打开了旧版 1.html、4.html 或 combined.html。

优先使用 GitHub Pages 地址重新打开网页。

### 2. 页面显示“请填写 Supabase URL 和 anon key”

说明 URL 或公开 key 没有填写完整。重新从 Project Settings -> API 复制：

- Project URL
- anon public key 或 Publishable key

不要复制项目名称、数据库密码或 service_role key。

### 3. 页面显示“relation study_states does not exist”

说明同步表还没有创建：

1. 回到 Supabase 的 SQL Editor。
2. 新建查询。
3. 再次粘贴 supabase-sync.sql 全部内容。
4. 点击 Run。

执行后刷新学习工具。

### 4. 页面显示权限错误、401 或 403

依次检查：

- Project URL 是否属于当前 Supabase 项目。
- key 是否复制完整。
- 是否已经登录学习工具的同步账号。
- study_states 是否开启 RLS。
- SQL 中三条 study_states_*_own policy 是否存在。
- 是否把 service_role key 错误地填入了网页。

### 5. 注册成功但无法登录

先查看页面提示：

- 如果提示查收邮件，先点击验证邮件。
- 如果邮件在垃圾箱，先把发件人加入信任列表。
- 确认登录邮箱与注册邮箱完全一致。
- 确认使用的是学习工具同步账号密码，而不是 Supabase 控制台密码。

### 6. 电脑和手机数据没有马上出现

检查：

- 两台设备是否登录同一个同步账号。
- 页面状态是否显示“已同步”。
- 是否点击了“生成内容”或提交了答案，使数据真正保存。
- 在另一台设备点击“立即同步”。
- 等待约 30 秒自动轮询。

如果某台设备仍然没有数据，先导出本地完整备份，再检查浏览器是否处于隐私模式。

### 7. 本地双击打开能用，但 GitHub Pages 打不开

检查仓库根目录是否同时有：

- index.html
- study-tool.html
- cloud-sync.js

并确认 GitHub Pages 的分支是 main、目录是 / (root)。修改后等待几分钟，并使用强制刷新。

### 8. 朗读没有声音

朗读使用浏览器的 speechSynthesis：

- 检查手机是否静音。
- 检查浏览器是否允许网页播放声音。
- 尝试点击“读英文”或“读中文”。
- 某些浏览器没有合适的中文或英文语音，但不影响默写和记录。

### 9. 我误删了记录怎么办

如果还没有导出备份，删除通常无法从本地恢复。建议在大量删除、覆盖导入或切换设备前先导出完整备份。

云端同步也不是版本控制系统。它保存当前状态，不保证可以恢复任意历史版本，因此仍然建议定期导出 JSON。

## 十三、安全注意事项

- 网页中只能使用 Supabase 的公开客户端 key。
- 严禁把 service_role key、Secret key、数据库密码放进 HTML、JavaScript、Markdown 或 GitHub。
- 不要把包含个人答题记录的完整备份 JSON 上传到公开仓库。
- 给别人共享题目时使用共享题库 JSON，不要使用完整备份 JSON。
- 每个使用者应使用自己的同步账号，不要多人共用一个账号。
- 公开仓库中的题目内容任何人都可能看到；需要保密的题目不要放在公开仓库。
- 修改 Supabase SQL 或 RLS 前，先导出完整备份并确认影响范围。

## 十四、最短操作清单

### 只想本地使用

1. 双击 all-in-one.html。
2. 输入 英文 | 中文。
3. 点击“生成内容”。
4. 开始默写。
5. 定期导出完整备份 JSON。

### 想电脑手机同步

1. 把项目上传到 GitHub。
2. 开启 GitHub Pages，得到网页地址。
3. 注册 Supabase 并创建项目。
4. 在 SQL Editor 执行 supabase-sync.sql。
5. 确认 Authentication 的 Email provider 已启用。
6. 从 Project Settings -> API 复制 Project URL 和公开客户端 key。
7. 在 Authentication -> URL Configuration 填写 GitHub Pages 地址。
8. 在网页“数据管理”中保存云配置。
9. 注册并验证学习工具同步账号。
10. 电脑和手机登录同一个同步账号。
11. 看到“已同步”后再开始跨设备使用。

本项目不要求安装 Node.js、数据库客户端或其他依赖。GitHub Pages 负责发布网页，Supabase 负责登录和保存同步数据，两者分别配置即可。
