import React from 'react';
import WebCam from 'react-webcam'
import { Button, Grid } from '@material-ui/core'
import * as tf from '@tensorflow/tfjs';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import * as mobilenet from '@tensorflow-models/mobilenet'
import './index.css'

export default class Index extends React.Component {
  constructor(props) {
    super(props);
    this.infoTexts = [];
    this.isTraining = true
    this.training = -1; // -1 when no class is being trained
    this.recordSamples = false;
    this.classes = ["Left", "Right"];
    this.testPrediction = false;
    this.training = true;

    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.startPredictions = this.startPredictions.bind(this)
    this.animate = this.animate.bind(this)
    this.state = {
      info: []
    }
    // Initiate deeplearn.js math and knn classifier objects

  }

  startPredictions() {
    this.testPrediction = true
  }

  componentDidMount() {
    this.video = document.getElementById('webCam')
    this.loadClassifierAndModel();
    this.setupButtonEvents();
  }

  async loadClassifierAndModel() {
    this.knn = knnClassifier.create();
    this.mobilenetModule = await mobilenet.load();
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

  setupButtonEvents() {
    for (let i = 0; i < 2; i++) {
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
          // If classes have been added run predict
          logits = infer();
          const res = await this.knn.predictClass(logits, 10);
          console.log(res.confidences)

          for (let i = 0; i < 2; i++) {
            // The number of examples for each class
            const exampleCount = this.knn.getClassExampleCount();

            if (exampleCount[i] > 0) {
              this.infoTexts[i] = ` ${
                exampleCount[i]
              } examples - ${res.confidences[i] * 100}%`;
              this.setState({
                info: this.infoTexts
              })
            }
          }
        }
      }

      if (this.isTraining) {
        // The number of examples for each class
        const exampleCount = this.knn.getClassExampleCount();

        for (let i = 0; i < 2; i++) {
          if (exampleCount[i] > 0) {
            this.infoTexts[i] = ` добавлено ${exampleCount[i]} примеров`;
            this.setState({
              info: this.infoTexts
            })
          }
        }
      }

      // Dispose image when done
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
          <WebCam id={'webCam'} width={300} height={300} />
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
          <Button onClick={this.startPredictions} variant="contained">предсказать!</Button>
        </Grid>
      </Grid>

    );
  }
}

