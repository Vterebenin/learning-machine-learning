import React, {Component} from 'react';
import './index.css'

class Index extends Component {
  render() {
    return (
      <>
        <h3>Загружаем обучаемую модель</h3>
        <div id="loader">
        </div>
      </>
    );
  }
}

export default Index;