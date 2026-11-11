# English Pronunciation Lab
GitHub Pages 前端 + Google Apps Script + Google Sheets。

## 功能
- 學生班級、學號、姓名；每回合隨機 5 句
- 英文語音示範、麥克風辨識、正確／錯誤／漏唸比對
- 完整度、精準度、練習次數與成績紀錄
- 教師 PIN、題庫管理、TXT 匯入匯出、成績查詢

## Google 後端設定
1. 建立 Google 試算表，開啟「擴充功能 → Apps Script」。
2. 將 gas/Code.gs 內容貼入 Code.gs，儲存。
3. 執行 setup() 並授權。
4. Apps Script「專案設定 → 指令碼屬性」設定 TEACHER_PIN 為自訂密碼。
5. 「部署 → 新增部署作業 → 網頁應用程式」，執行身分選「我」，存取權限依學校政策允許學生使用，部署後複製 /exec URL。
6. 編輯 index.html，把 API_URL 的提示文字換成該 /exec URL。

## GitHub Pages
Repository Settings → Pages → Deploy from a branch → main → /(root) → Save。
網站網址：https://kevin89945-hue.github.io/english-pronunciation-lab/

## 注意
評分依語音辨識文字比對，不是音素層級發音評測；建議使用 Chrome 或 Edge。學生姓名、學號與成績會寫入你的 Google Sheets，請限制試算表存取權。
