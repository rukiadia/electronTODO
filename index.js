'use strict';

const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

// GC防止
let mainWindow = null;

const createWindow = () => {
  // メインウィンドウ作成
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600
  });

  // メインウィンドウに対するURL指定
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // メインウィンドウ、クローズ時
  mainWindow.on('closed', function(){
    mainWindow = null;
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', function(){
  // macOS以外の場合はアプリケーション終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function(){
  // メインウィンドウが消えている場合は、再度メインウィンドウを作成する
  if (mainWindow === null){
    createWindow();
  }
});