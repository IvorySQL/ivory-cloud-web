# 安装

## 前期准备

ivory-cloud-web作为一个开源前端项目，开发过程中需要在本地安装git、node等。

fork开源云平台后端仓库到自己的github账号，然后clone到自己本地，例如：

```sh
YOUR_GITHUB_UN="<your GitHub username>"
git clone "git@github.com:${YOUR_GITHUB_UN}/ivory-cloud-web.git"
```

进入项目根目录：

```
cd ivory-cloud-web
```

安装依赖：

```
npm install
```

## 本地运行

### 配置后端接口地址

修改`public`目录下的config.js：

```
PLATFROM_CONFIG.baseUrl = "http://127.0.0.1:8081/cloudapi/api/v1"
```

将baseUrl中的IP修改为后端项目服务器的IP地址，开源云平台后端服务默认端口为8081，如果后端服务端口进行了变更，baseUrl也应根据实际进行相应的修改。

### 运行项目

进入项目根目录执行：

```
npm run dev
```

等项目运行成功后可以使用浏览器访问http://localhost:9528。

## 前端部署

### 编译打包

进入项目根目录执行：

```
npm run build:prod
```

打包完成后可以在项目根目录下发现`dist`目录，将`dist`放入服务器的`/home/cloud/web`目录下，`/home/cloud/web`允许自定义。

### 通过nginx部署前端项目

首先，请确保服务器已经安装了nginx。编辑nginx的配置文件nginx.conf，修改监听的端口和网站根目录，可以参考以下配置：

```
server {
        listen       9104;
        server_name  localhost;
        location / {
            root   /home/cloud/web/dist;
            index  index.html index.htm;
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
}
```

重启nginx使更改生效，现在可以使用浏览器访问前端应用：

```
http://your_server:9104
```

确保替换 `your_server` 为您的实际IP地址。