# 減脂計畫追蹤 🎯

一個簡約 Mac 風格的個人減脂追蹤 PWA。純前端、免後端、資料存在手機本機，可「加入主畫面」當 App 用，離線也能開。

## 功能

- **今日打卡**：完成度圓環、每日任務勾選、蛋白質計數（含常見食材快速加）、喝水杯數、餐點筆記。
- **飲食計算**：輸入身高/體重/體脂/BMR，自動算出目標體重、需減脂肪、每日攝取熱量與蛋白質目標。
- **課表**：一週運動課表（居家重訓 + 有氧 + 籃球）與飲食核心概念（碳水循環、低普林顧尿酸、便當吃法）。
- **進度**：記錄體重/體脂，畫出趨勢曲線與歷史紀錄。

> ⚠️ 所有數值為估算，僅供參考。若有尿酸偏高等健康狀況，請先與醫師確認再執行。

## 本機預覽

直接用瀏覽器打開 `index.html` 即可。若要測試 PWA / Service Worker，需用本機伺服器：

```bash
# 任選一種
npx serve fat-tracker
python -m http.server 8000
```

## 產生圖示

打開 `generate-icons.html`，按「兩個都下載」，把 `icon-192.png` 與 `icon-512.png` 放回本資料夾。

## 部署到 GitHub Pages

這個 repo 已有一份部署 `food-picker` 的 workflow。要改成部署本專案，把 `.github/workflows/deploy.yml` 裡的 `path` 改成 `fat-tracker`：

```yaml
      - uses: actions/upload-pages-artifact@v3
        with:
          path: fat-tracker
```

推到 `main` 分支後，到 repo 的 Settings → Pages 確認來源為 GitHub Actions，網址會顯示在 Actions 部署結果中。手機開啟該網址 → 瀏覽器選單 → 「加入主畫面」即可當 App。

## 技術

- 原生 HTML / CSS / JavaScript，零相依套件
- PWA：`manifest.json` + Service Worker 離線快取
- `localStorage` 儲存資料（純本機、無雲端、無追蹤）

## 資料隱私

所有紀錄只存在你自己的裝置瀏覽器中。清除瀏覽器資料會一併清掉紀錄，需要保留請自行記下。
