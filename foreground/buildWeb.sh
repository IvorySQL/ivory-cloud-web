#!/bin/bash

#showRegister value: reg, noreg
showRegister=$1

fileName=./src/settings.js

key='showRegister'
value='true'

function getRegisterPermission()
{
	echo "showRegister" $showRegister
	if [ ! -n "$showRegister" ]; then
	
	 	echo "didn't set reg param,so use default: true"
	else
		if [ $showRegister != 'reg' ]; then
	             	echo "do not show register button."
			value='false'
		else
			echo "need show register button."
		fi
	fi
}

function changeSettingFile()
{
	# 获取key的行号
	line=$(grep -n "$key" $fileName | cut -d ":" -f 1)
	
	echo $line
	
	# 修改文件,行号为line的内容
	line=$line"c $key: $value"
	#替换line行的内容为 $key: $value
	sed -i "$line" $fileName
}

function buildWeb()
{
	echo "begin to build dist"

	npm run build:prod
	
	tar -czvf dist.tar.gz dist
}

function main()
{
	#getRegisterPermission

	#changeSettingFile
	
	buildWeb
}
main
