import React from 'react';
import WebCam from 'react-webcam'
import { Button, Grid } from '@material-ui/core'
import * as tf from '@tensorflow/tfjs';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import * as mobilenet from '@tensorflow-models/mobilenet'
import Loader from '../loader'
import './index.css'

export default class Index extends React.Component {
  constructor(props) {
    super(props);
    this.infoTexts = [];
    this.isTraining = true
    this.training = -1; // -1 используем если не тренируем
    this.recordSamples = false;
    this.classes = ["Left", "Right"];
    this.testPrediction = false;
    this.training = true;
    this.numberOfSubjects = 2;

    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.startPredictions = this.startPredictions.bind(this)
    this.animate = this.animate.bind(this)
    this.state = {
      loading: false,
      info: []
    }
  }

  startPredictions() {
    this.testPrediction = true
  }

  componentDidMount() {
    this.setState({
      loading: true
    })
    this.loadClassifierAndModel().then(() => (
      this.setState({
        loading: false
      })
    ))
    this.setup();
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    this.video = document.getElementById('webCam')
  }

  async loadClassifierAndModel() {
    this.knn = knnClassifier.create();
    this.mobilenetModule = await mobilenet.load();

    console.log(this.video)
    console.log('model loaded')
    this.start();
  }

  handleMouseDown(i) {
    this.training = i;
    this.recordSamples = true;
  }

  handleMouseUp() {
    this.training = -1
  }

  setup() {
    for (let i = 0; i < this.numberOfSubjects; i++) {
      const infoText = "Не добавлено примеров";
      this.infoTexts.push(infoText);
    }

    this.setState({
      info: this.infoTexts
    })
  }

  start() {
    if (this.timer) {
      this.stop();
    }
    this.timer = requestAnimationFrame(this.animate);
  }

  stop() {
    cancelAnimationFrame(this.timer);
  }

  async animate() {
    if (this.recordSamples) {
      // Get image data from video element
      const image = tf.browser.fromPixels(this.video);

      let logits;
      // 'conv_preds' is the logits activation of MobileNet.
      const infer = () => this.mobilenetModule.infer(image, "conv_preds");

      // Train class if one of the buttons is held down
      if (this.training !== -1) {
        logits = infer();

        // Add current image to classifier
        this.knn.addExample(logits, this.training);
      }

      const numClasses = this.knn.getNumClasses();

      if (this.testPrediction) {
        this.isTraining = false;
        if (numClasses > 0) {
          // Если были добавлены классы, то запускаем предположение
          logits = infer();
          // Значение K в алгоритме KNN важно, потому что оно представляет количество
          // экземпляров, которые мы учитываем при определении класса нашего ввода.
          // В этом случае значение 10 означает, что при прогнозировании метки
          // для некоторых новых данных мы будем смотреть на 10 ближайших
          // соседей из обучающих данных, чтобы определить, как классифицировать новый вход.
          const res = await this.knn.predictClass(logits, 10);
          console.log(res.confidences)

          for (let i = 0; i < this.numberOfSubjects; i++) {
            // Количество примеров для каждого класса
            const exampleCount = this.knn.getClassExampleCount();

            if (exampleCount[i] > 0) {
              this.infoTexts[i] = ` ${
                exampleCount[i]
              } примеров - ${res.confidences[i] * 100}%`;
              this.setState({
                info: this.infoTexts
              })
            }
          }
        }
      }

      if (this.isTraining) {
        // Количество примеров для каждого класса
        const exampleCount = this.knn.getClassExampleCount();

        for (let i = 0; i < this.numberOfSubjects; i++) {
          if (exampleCount[i] > 0) {
            this.infoTexts[i] = ` добавлено ${exampleCount[i]} примеров`;
            this.setState({
              info: this.infoTexts
            })
          }
        }
      }

      // В завершении удаляем обработанное изображение
      image.dispose();
      if (logits != null) {
        logits.dispose();
      }
    }
    this.timer = requestAnimationFrame(this.animate);
  }

  render() {

    return (

      <Grid container alignItems={'center'}>

        {this.state.loading ? (
          <Grid item md={12}>
            <Loader/>
          </Grid>
        ) : (
          <>
            <Grid item xs={12} md={4}>
              <Button
                className="button"
                variant="contained"
                onMouseDown={() => this.handleMouseDown(0)}
                onMouseUp={() =>this.handleMouseUp()}
              >
                Положение слева
              </Button>
              <p>
                {this.infoTexts[0]}
              </p>
            </Grid>
            <Grid item xs={12} md={4}>
              <WebCam id={'webCam'} width={227} height={227} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                className="button"
                variant="contained"
                onMouseDown={() => this.handleMouseDown(1)}
                onMouseUp={() =>this.handleMouseUp()}
              >
                Положение справа
              </Button>
              <p>
                {this.infoTexts[1]}
              </p>
            </Grid>
            <Grid item md={12}>
              <Button onClick={this.startPredictions} variant="contained">Предсказать!</Button>
            </Grid>
          </>
        )}
      </Grid>

    );
  }
}

