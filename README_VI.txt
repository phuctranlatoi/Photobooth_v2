LE SOUVENIR PHOTOBOOTH V2 - HUONG DAN CAP NHAT NOI DUNG 9 AGENT

Noi dung: 9 agent Markdown chi tiet va script cap nhat.

Thu muc dich: E:\HK1_2026_2027\PhotoboothDesktop_v2
Thu muc cu:  E:\HK1_2026_2027\PhotoboothDesktop - TUYET DOI KHONG SUA

TINH AN TOAN
- Script chi doc 9 template trong V2 va thay BODY cua 9 agent .md trong V2.
- Giữ nguyen YAML frontmatter cua moi agent hien tai: model, mode, permission, description.
- Tao backup cac agent hien tai trong V2 truoc khi ghi.
- Khong dong cham .env, opencode.json hoac bat ky file V1 nao.
- Neu thieu 1 file hoac frontmatter sai, dung truoc khi thay file.

CAI DAT (PowerShell)
1. Tai ZIP vao Downloads.
2. Chay:
   $project = 'E:\HK1_2026_2027\PhotoboothDesktop_v2'
   Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\le_souvenir_v2_agent_prompts_full.zip" -DestinationPath $project -Force
3. Chay:
   cd $project
   powershell -NoProfile -ExecutionPolicy Bypass -File .\install_agent_prompts.ps1
4. Dong va mo lai OpenCode:
   opencode agent list
   opencode

9 AGENT
- orchestrator: primary, phan chia viec, bao ve V1, nghiem thu
- legacy-auditor: doc toan bo V1, tai lieu hoa va trich dan duong dan
- architect: kien truc IPC, Tauri/Electron, Kotlin/Canon/DNP POC
- ui-designer: thiet ke touch-first 16:10, design system
- frontend-coder: React/TypeScript UI thuc te
- camera-engineer: Canon SDK, webcam, Hot Folder
- printer-engineer: DNP RX1HS, Windows spooler, in dung ty le
- backend-engineer: Kotlin state, Beauty, LUT, QR, PayOS/Neon
- tester-reviewer: test doc lap, security, real hardware release gate

Luu y: agent chi doc V1 bang lenh khong lam thay doi. Quyen OpenCode
khong thay the phan quyen he dieu hanh. Khong phe duyet lenh build,
run, git clean, reset, xoa hoac ghi V1.
