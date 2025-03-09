import React, { useState } from 'react';
import './App.css';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  // 検索機能
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`https://jctykyatb8.execute-api.ap-northeast-1.amazonaws.com/prod/foods?name=${searchTerm}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('検索エラー:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // CSVアップロード
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('ファイルを選択してください');
      return;
    }

    setUploadStatus('アップロード中...');
    
    try {
      // S3署名付きURLを取得
      const urlResponse = await fetch('https://jctykyatb8.execute-api.ap-northeast-1.amazonaws.com/prod/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      
      const { uploadUrl } = await urlResponse.json();
      
      // S3にファイルをアップロード
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
      });
      
      setUploadStatus('アップロード成功！データの処理中...');
      
      // 処理状況を確認（オプション）
      setTimeout(() => {
        setUploadStatus('データが正常に処理されました');
      }, 3000);
      
    } catch (error) {
      console.error('アップロードエラー:', error);
      setUploadStatus('アップロード失敗');
    }
  };

  return (
    <div className="app">
      <header>
        <h1>食材価格検索</h1>
      </header>
      
      <div className="search-section">
        <input
          type="text"
          placeholder="食材名を入力"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? '検索中...' : '検索'}
        </button>
      </div>
      
      <div className="results-section">
        {searchResults.length > 0 ? (
          <div className="results-table">
            <div className="table-header">
              <div className="col">日付</div>
              <div className="col">食材名</div>
              <div className="col">購入場所</div>
              <div className="col">金額</div>
            </div>
            {searchResults.map((item, index) => (
              <div className="table-row" key={index}>
                <div className="col">{item.purchaseDate}</div>
                <div className="col">{item.name}</div>
                <div className="col">{item.store}</div>
                <div className="col">{item.price}円</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-results">
            {isLoading ? '読み込み中...' : searchTerm ? '結果がありません' : '食材名を入力して検索してください'}
          </p>
        )}
      </div>
      
      <div className="upload-section">
        <h2>データのアップロード</h2>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!file}>アップロード</button>
        {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
      </div>
    </div>
  );
}

export default App;