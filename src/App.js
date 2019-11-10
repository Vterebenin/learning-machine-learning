import React from 'react';
import './App.css';
import WebCamAnylizer from './webCamAnylizer'

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <WebCamAnylizer/>
        </div>
      </div>
    );
  }
}

export default App;
