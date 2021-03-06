"use strict";

const moment = require('moment');

const module = {
  db: null,
  setEventListeners: () => {
    module.form = document.querySelector('.jscForm');
    module.todoText = document.querySelector('.jscTodoText');
    module.todoList = document.querySelector('.jscTodoList');
    module.todoList.addEventListener('click', (event) => {
      module.updateTodo(event.target);
    });
    module.form.addEventListener('submit', (event) => {
      event.preventDefault();
      module.addTodo();
    }, false);
  },
  renderer: (resultArray) => {
    // TODOリストの描画
    module.todoList.innerHTML = ''; // リストのリセット
    let documentFragment = document.createDocumentFragment();
      for (let i = 0; i < resultArray.length; i++) {
      const li = document.createElement('li');
      li.innerHTML = `${resultArray[i].text}`;
      li.dataset.timeStamp = resultArray[i].timeStamp;
      li.classList.add('list');
      if (resultArray[i].isComplete) {
        li.classList.add('completed');
      }
      documentFragment.appendChild(li);
    }
    module.todoList.appendChild(documentFragment);
  },
  init: () => {
    // 初期処理
    module.setEventListeners();
    const request = window.indexedDB.open('my_db', 3);

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
      const store = db.createObjectStore('todo', {
        // timeStampは一意なので、keyPathとして使う
        keyPath: 'timeStamp'
      });
    };

    // DBを開くリクエスト。ここが正常に上手くいった場合は、保持
    request.onsuccess = (event) => {
      module.db = event.target.result;
      // 初期表示時に、保存されている物を全て取っておく
      module.getAllTodo();
    }
  },
  addTodo: () => {
    const text = module.todoText.value;
    if (!text.length) {
      alert('入力欄が未入力です');
      return;
    }
    module.todoText.value = '';

    const db = module.db;
    // DBからObjectStoreへのトランザクションを生成する
    // この段階でtodoというObjectStoreをつくってないとエラーを吐く
    // アクティブなobjectの生成
    const transaction = db.transaction(['todo'], 'readwrite');
    const todoObjectStore = transaction.objectStore('todo');
    const addData = {
      text: text,
      date: moment().format('MM/DD'),
      isComplete: false,
      timeStamp: Date.now()
    };
    // putするリクエストを生成
    todoObjectStore.put(addData);
    transaction.oncomplete = () => {
      // リクエスト成功時は、リストに反映
      const li = document.createElement('li');
      li.innerHTML = `${addData.text}`;
      li.dataset.timeStamp = addData.timeStamp;
      li.classList.add('list');
      module.todoList.appendChild(li);
    };
    transaction.onerror = (error) => {
      alert(error);
    };
  },
  updateTodo: (clickedList) => {
    // データの完了フラグ(isComplete)を書き換える
    const timeStamp = clickedList.dataset.timeStamp;
    const db = module.db;
    const store = db.transaction(['todo'], 'readwrite').objectStore('todo');    const cursorRequest = store.openCursor();
    const request = store.get(parseInt(timeStamp, 10));

    request.onsuccess = () => {
      let data = request.result;
      data.isComplete = !(data.isComplete);
      const requestUpdate = store.put(data);
      requestUpdate.onsuccess = () => {
        // リストの見た目も更新し、データと見た目の整合性をとる
        if (clickedList.classList.contains('completed')) {
          clickedList.classList.remove('completed');
        } else {
          clickedList.classList.add('completed');
        }
      };
      requestUpdate.onerror = (error) => {
        alert(error);
      };
    };

    request.onerror = (error) => {
      alert(error);
    };
  },
  getAllTodo: () => {
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
        module.renderer(resultArray);
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