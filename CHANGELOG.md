# 更新日志

## v1.1.0 2026-11-17

- 增加超管首页置顶及两种管理员的板块置顶，服务端鉴权、事务审计、下架清除。
- 增加超管页脚联系方式总开关及最多4种独立联系框，支持逐项开关、签名校验、并发版本检查，关闭后不公开号码。
- 增加007迁移、功能测试，更新预览和部署文档；外层五个文件名保持不变。
- 53项Node测试、本地真实MySQL 14组验证和168组新增界面布局通过。


## v1.0.1 2026-11-16

## V3.1 修复交付版 v1.0.1

2026-11-16 修复：sharp 升至 0.35.5 并提交 npm 锁文件；验证码在失败重试前刷新；单条举报和申诉执行目标身份检查；单条内容、表情和栏目管理将数据与审计放入同一事务；批量参数错误返回 400；API 日期输出 UTC；评论审核增加受限上下文入口；健康检查探测 MySQL/Redis，另设存活检查；翻译缓存按内容生成，合并同篇并发请求，使用有界队列和 Redis 共享缓存；巴西葡萄牙语使用 pb；补齐表情卷目录与 Compose 健康检查。

本次在 Windows x64 的 Node 22.23.5 上执行 48 项 Node 测试通过，包括实际 Express HTTP 路由配合数据库事务替身，以及 JPG/PNG/WebP 上传重编码。npm 官方依赖审计为 0 条已知漏洞。测试结果不代表未知漏洞不存在。真实 Linux Docker、MySQL、Redis、SMTP、Turnstile 和 LibreTranslate 模型仍须在目标服务器验收。

运行依赖使用 package-lock.json 和 npm ci。不要在目标服务器重新生成锁文件来掩盖构建失败。旧站更新不需要新增数据库迁移，不运行 schema.sql 覆盖生产数据。


## v1.0.0 — GitHub first public source release (internal V3.1)

- Add selectable/full-page batch moderation in all applicable governance lists: review approvals/rejections **including risk exposure**, takedowns, comments, reports, appeals, user mutes, sticker and section status. Each batch has capped IDs, a reason, explicit evidence review acknowledgement for sensitive publication, individual permission/state checks and correlated audit entries.
- Publish the complete forum application, database schema, container deployment definitions and comprehensive product requirements.
- Fix post-detail return navigation to restore the originating moderator/super-admin review queue, post management tab, section, search results or member feed.
- Refresh the originating moderation list after a takedown; preserve filter/search context where applicable.
- Keep role-based moderation, privacy-aware risk reporting, evidence/media limits, multilingual UI, optional self-hosted translation, password recovery, audit and donation-address safeguards.
- Include GitHub community files, CI, release instructions, and a standalone interactive HTML preview.

**Release status:** Open-source MVP/reference implementation. Database, SMTP, production Docker and security penetration tests remain necessary before serving real users. The sandbox was unable to access npm registry to generate a verified package-lock.json.
