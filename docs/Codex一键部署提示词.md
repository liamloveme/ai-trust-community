# Codex 部署提示词

部署对象为 AI交易守望站 V3.1 修复交付版，package.json 版本 1.0.1。请在我明确授权的服务器范围内实施。不要覆盖现有数据库、删除上传文件或重建数据卷。此次代码修复不等于服务器已验收。

1. 阅读 README、PRD、Dockerfile、docker-compose.yml、.env.example 和测试交付说明，先核对目标运行时、CPU/RAM、磁盘、端口、反代链路及回滚方案。
2. 新站使用空库初始化；旧站先备份数据库、上传和表情卷并验证可恢复。v1.0.1 没有新增 schema 迁移，禁止覆盖旧库运行全量 schema，禁止执行 docker compose down -v。
3. 填写 production 环境、HTTPS PUBLIC_ORIGIN、DB/Redis 独立随机密码、至少64位十六进制 DONATION_CONFIG_HMAC_KEY、真实 Turnstile 和 SMTP。不要打印 .env、密码、token 或重置链接。
4. package-lock.json 已提供，使用 npm ci；不要重新 npm install 改写锁文件。先 docker compose config --quiet，再构建并启动，确认 app、MySQL、Redis 健康；/api/live 只检查进程，/api/health 必须检查依赖。
5. TRUST_PROXY=1 仅对应一层受控反代，反代覆盖 X-Forwarded-For。存在 CDN/Tunnel 时按真实链路配置，验证不同客户端的 req.ip 独立，且访客不能伪造。反代翻译读取超时建议120秒，上传体积限制与5MB单图一致。
6. 在非 root app 用户下检查 uploads、stickers 两个目录可写；测试 JPG/PNG/WebP 重编码、伪装格式拒绝、私密证据隔离、下架图片失效、卷重启持久化。旧卷权限问题先备份再修复所有者，不删卷。
7. 核验注册、登录失败后验证码刷新、密码修改与邮件重置。普通管理员不能单条或批量处理其他管理员的举报/申诉/内容；审计写失败时数据必须回滚。测试 1/100/101 条、重复 ID 和混合结果。
8. 测试评论审核上下文和图片入口，不得泄露未公开父帖或私密证据；测试待审/已发布后台进入详情后返回原标签，下架后刷新原列表。确认时间按 UTC 传输、按浏览器时区显示。
9. 如启用翻译，使用 --profile translate，确认固定镜像、所需模型和 /api/translation/languages。分离翻译机只走私网，私网IP可配置，内部DNS需显式允许；端口仅允许网站机访问。验证长短帖、不同源语言、未安装模型、缓存命中、队列满429和服务重启。模型升级递增 TRANSLATE_MODEL_REVISION。
10. 按资源调整 app/translate 的容器限额；默认每Node进程2个翻译任务，多实例需汇总并发。对100/300/500活跃会话分级压测并记录指标；不将在线人数当作同时推理任务数。
11. 完成真实 SMTP、Turnstile、TLS、备份恢复、监控告警及部署后依赖审计。交付URL、容器健康、API/权限测试、备份与回滚位置，以及未验证事项；不要声明绝对安全或未实测的承载量。

服务器起步预算：网站8核16GB RAM/100–200GB SSD，独立翻译8核16GB至16核32GB/100–200GB SSD；多语言数量、文章长度和翻译并发决定最终配置。开放前以目标服务器压测为准。公开 GitHub 前按开源指南排除真实用户资料与所有密钥。
