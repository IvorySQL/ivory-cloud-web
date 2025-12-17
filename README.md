# Installation
## Prerequisites
- Node 18
- IvorySQL 5.1
- Kubernetes 1.23 (Must have default storage class)

## Installation instructions

As an open-source frontend project, ivory-cloud-web requires the local installation of git, node, etc., during the development process.

Fork the frontend repository of the open-source cloud platform to your own GitHub account, then clone it to your linux machine, for example:

```sh
YOUR_GITHUB_UN="<your GitHub username>"
git clone "git@github.com:${YOUR_GITHUB_UN}/ivory-cloud-web.git"
```


## Deployment

### Compile and build
Enter the project root directory:

```
cd ivory-cloud-web
```

Install dependencies:

```
npm install
```
Build
``` 
npm run build:prod
```

After the packaging is completed, you can find the `dist` directory in the root directory of the project. Place the `dist` directory into the `/opt/cloud/web` directory of the server. `/opt/cloud/web` can be customized.
  
### Deploy frontend projects via nginx

First, please ensure that nginx is installed on the server. Edit the nginx configuration file `nginx.conf` , modify the listening port and the website root directory, and you can refer to the following configuration:
Replace the IP with the actual IP of the current server.

```
server {
        listen       9104;
        server_name  127.0.0.1;
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
