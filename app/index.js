const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('<h1>ShopSmart App is Running!</h1><p>Successfully deployed via GitHub Actions & Terraform.</p>');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
