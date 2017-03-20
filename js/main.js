"use strict";

const moment = require('moment');

const module = {
  db: null,
  setEventListeners: function(){
    this.addBtn = document.querySelector('#addBtn');
    this.todoText = document.querySelector('#todoText');
    this.addBtn.addEventListener('click', function(){
      module.addTodo();
    }, false);
  },
  renderer: function(todo){
    var li = document.createElement('li');
    li.innerHTML = `${todo.text}`;
    document.querySelector('.todoList').appendChild(li);
  },
  init: function(){
    // 初期処理
    this.setEventListeners();
    var request = window.indexedDB.open('my_db', 3);

    request.onupgradeneeded = (event) => {
      // DBVersionが上がった場合だけ呼ばれる
      let db = event.target.result;
      event.target.transaction.onerror = (error) => {
        alert(error);
      };

      // 既存schema削除
      if (db.objectStoreNames.contains('todo')) {
        db.deleteObjectStore('todo');
      }
      // 新規作成
      var store = db.createObjectStore('todo', {
        // timeStampは一意なので、keyPathとして使う
        keyPath: 'timeStamp'
      });
      console.log('store', store);
    };

    // DBを開くリクエスト。ここが正常に上手くいった場合は、保持
    request.onsuccess = (event) => {
      module.db = event.target.result;
      // 初期表示時に、保存されている物を全て取っておく
      module.getAllTodo(module.renderer);
    }
  },
  addTodo: function(){
    const text = this.todoText.value;
    if (!text.length) {
      alert('入力欄が未入力です');
      return;
    }

    const db = module.db;
    // DBからObjectStoreへのトランザクションを生成する
    // この段階でtodoというObjectStoreをつくってないとエラーを吐く
    // アクティブなobjectの生成
    const transaction = db.transaction('todo', 'readwrite');
    const todoObjectStore = transaction.objectStore('todo');
    // putするリクエストを生成
    todoObjectStore.put({
      text: text,
      date: moment().format('MM/DD'),
      timeStamp: Date.now()
    });
    transaction.oncomplete = () => {
      // リクエスト成功時は、リストに反映
      module.getAllTodo(module.renderer);
    };
    transaction.onerror = (error) => {
      alert(error);
    };
  },
  getAllTodo: function(renderer){
    if (renderer) {
      document.querySelector('.todoList').innerHTML = '';
    }
    const db = module.db;
    const transaction = db.transaction('todo', 'readwrite');
    const store = transaction.objectStore('todo');

    // keyPathに対して検索をかける範囲を取得
    const range = IDBKeyRange.lowerBound(0);
    const cursorRequest = store.openCursor(range);

    // カーソルリクエストの成功
    cursorRequest.onsuccess = (event) => {
      const result = event.target.result;
      // 走査すべきObjectがこれ以上ない場合
      if (!result) {
        return;
      }
      if (renderer) {
        renderer(result.value);
      }
      // マッチした場合は処理を続行
      result.continue();
    };

    // カーソルリクエストの失敗
    cursorRequest.onerror = (error) => {
      alert(error);
    };
  }
};

(function(){
  module.init();
})();