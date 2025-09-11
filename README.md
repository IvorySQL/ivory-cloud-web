# Installation

## Installation instructions

As an open-source frontend project, ivory-cloud-web requires the local installation of git, node, etc., during the development process.

Fork the fronted repository of the open-source cloud platform to your own GitHub account, then clone it to your local machine, for example:

```sh
YOUR_GITHUB_UN="<your GitHub username>"
git clone "git@github.com:${YOUR_GITHUB_UN}/ivory-cloud-web.git"
```

Enter the project root directory:

```
cd ivory-cloud-web
```

Install dependencies:

```
npm install
```


## Run locally
### Configure the backend interface address


Modify the config.js under the`public`directory:

```
PLATFROM_CONFIG.baseUrl = "http://127.0.0.1:8088/cloudapi/api/v1"
```

Change the IP in baseUrl to the IP address of the backend project server. The default port is 8088. If the port has been changed, the baseUrl should also be modified accordingly based on the actual situation.

### Run the project

Enter the project root directory and execute:

```
npm run dev
```

After the project runs successfully, you can access  `http://localhost:9528`  using a browser.

## Deployment

### Compile and build

Enter the project root directory and execute:

```
npm run build:prod
```

After the packaging is completed, you can find the `dist` directory in the root directory of the project. Place the `dist` directory into the `/home/cloud/web` directory of the server. `/home/cloud/web` can be customized.
  
### Deploy frontend projects via nginx

First, please ensure that nginx is installed on the server. Edit the nginx configuration file `nginx.conf` , modify the listening port and the website root directory, and you can refer to the following configuration:

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

Restart nginx to make the changes take effect. Now you can access the frontend application using a browser:

```
http://your_server:9104
```

Make sure to replace `your_server` with your actual IP address.
