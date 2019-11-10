import React from 'react';
import './App.css';
import WebCamAnylizer from './webCamAnylizer'

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h3>
           Ваше собственное тестирование машинного обучения!
          </h3>
          <h4>Как это сделать?</h4>
          <ol className="tutorial">
            <li>Натренируйте нейросеть с уколоном тела/головы влево и вправо</li>
            <li>Проверьте на работоспособность!</li>
          </ol>
          <WebCamAnylizer/>
        </div>
      </div>
    );
  }
}

export default App;
