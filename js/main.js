"use strict";

const moment = require('moment');

const module = {
  db: null,
  setEventListeners: () => {
    module.addBtn = document.querySelector('#addBtn');
    module.todoText = document.querySelector('#todoText');
    module.todoList = document.querySelector('.todoList');
    module.todoList.addEventListener('click', (event) => {
      const timeStamp = event.target.dataset.timeStamp;
      module.updateTodo(timeStamp);
    });
    module.addBtn.addEventListener('click', () => {
      module.addTodo();
    }, false);
  },
  renderer: (resultArray) => {
    for (let i = 0; i < resultArray.length; i++) {
      var li = document.createElement('li');
      li.innerHTML = `${resultArray[i].text}`;
      li.dataset.timeStamp = resultArray[i].timeStamp;
      module.todoList.appendChild(li);
    }
  },
  init: () => {
    // 初期処理
    module.setEventListeners();
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
  addTodo: () => {
    const text = module.todoText.value;
    if (!text.length) {
      alert('入力欄が未入力です');
      return;
    }

    const db = module.db;
    // DBからObjectStoreへのトランザクションを生成する
    // この段階でtodoというObjectStoreをつくってないとエラーを吐く
    // アクティブなobjectの生成
    const transaction = db.transaction(['todo'], 'readwrite');
    const todoObjectStore = transaction.objectStore('todo');
    // putするリクエストを生成
    todoObjectStore.put({
      text: text,
      date: moment().format('MM/DD'),
      isComplete: false,
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
  updateTodo: (timeStamp) => {
    // データの完了フラグ(isComplete)を書き換える
    const db = module.db;
    const store = db.transaction(['todo'], 'readwrite').objectStore('todo');    const cursorRequest = store.openCursor();
    const request = store.get(parseInt(timeStamp, 10));

    request.onsuccess = (event) => {
      let data = request.result;
      data.isComplete = !(data.isComplete);
      const requestUpdate = store.put(data);
      requestUpdate.onsuccess = (event) => {
        console.log('data update success');
      };
      requestUpdate.onerror = (error) => {
        alert(error);
      };
    };

    request.onerror = (error) => {
      alert(error);
    };
  },
  getAllTodo: (renderer) => {
    if (renderer) {
      document.querySelector('.todoList').innerHTML = '';
    }
    const db = module.db;
    const store = db.transaction(['todo'], 'readwrite').objectStore('todo');

    // 値を横断的に取得
    const cursorRequest = store.openCursor();
    const resultArray = [];
    cursorRequest.onsuccess = (event) => {
      // カーソルリクエストの成功
      const result = event.target.result;
      // 走査すべきObjectがこれ以上ない場合は処理終了
      if (!result) {
        renderer(resultArray);
        return;
      }
      resultArray.push(result.value);
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