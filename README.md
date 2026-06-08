# Tampermonkey Scripts

我的油猴脚本集合。

## 列表

| 脚本 | 匹配站点 | 说明 |
|------|----------|------|
| [xau-cny-gram-price.user.js](./xau-cny-gram-price.user.js) | `cn.investing.com/currencies/xau-cny` | 将黄金盎司价格转换为每克人民币价格 |

## 安装

### 方式一：直接安装

在脚本列表中点击 `.user.js` 文件 → Raw → Tampermonkey 会自动弹出安装提示。

### 方式二：手动安装

1. 打开 Tampermonkey 管理面板
2. 新建脚本
3. 复制 `.user.js` 文件全部内容粘贴进去
4. `Ctrl+S` 保存

## 目录结构

```
tampermonkey/
├── .gitignore
├── README.md
└── *.user.js          # 所有脚本放根目录，一个文件一个脚本
```

## 开发

脚本命名规范：`{站点}-{功能描述}.user.js`
