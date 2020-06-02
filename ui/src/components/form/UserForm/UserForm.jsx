import io from 'socket.io-client';
import React, {Component} from 'react';
import {GetForm} from '../FormsHandling';
import FormStep from './FormStep';
import EndStep from './EndStep';
import {LockStep} from './LockStep';

let socketConnection;
const ENDPOINT = process.env.REACT_APP_SERVER_API_URL;

export class UserForms extends Component {
  constructor(props) {
    super(props);
    this.state = {
      step: 1, // get from db
      formScheme: {},
      filledFormNumberID: -1,
      socketResponse: '',
      formID: ''
    };
  }
//`step_${this.getPendingFormID()}`
  nextStep = () => {
    const {step} = this.state;
    this.setState({
      step: step + 1,
    });
    if (step <= 3) window.localStorage.setItem(`step_${this.getPendingFormID()}`, (step + 1).toString());
    if (step >= 2)
      this.socketEmitUpdate();
  };

  previousStep = () => {
    const {step} = this.state;
    if (step > 0) {
      this.setState({
        step: 1,
      });
    }
    if (step >= 1) window.localStorage.setItem(`step_${this.getPendingFormID()}`, (step - 1).toString());
    this.socketEmitUpdate();
  };

  getStepFromDatabase = () => {
    GetForm(this.getPendingFormID(), '/api/forms/pendingForms/whole-key').then(res => console.log(res));
    GetForm(this.getPendingFormID(), '/api/forms/filled-forms/whole-key').then(res => console.log(res));
  }

  mountStep = () => {
    this.getStepFromDatabase();
  }

  socketEmitUpdate = () => {
    const command = 'update'
    const stepToUpdate = window.localStorage.getItem(`step_${this.getPendingFormID()}`)
    const pendingFormData = {
      filledFormNumberID: this.getPendingFormID(),
      state: stepToUpdate
    }

    socketConnection.emit(
        `pendingFormID`,
        pendingFormData
    );
  }

  socketEmitData = () => {
    if (
        window.localStorage.getItem(`data_${this.getPendingFormID()}`) &&
        window.localStorage.getItem(`step_${this.getPendingFormID()}`) < 3
    ) {

      const command = 'create'

      const pendingFormData = {
        dataForm:  JSON.parse(window.localStorage.getItem(`data_${this.getPendingFormID()}`)),
        templateID: this.state.formID,
        userID: this.state.formScheme.userID,
        filledFormNumberID: this.getPendingFormID(),
        state: '2'
      };

      socketConnection.emit(
          `pendingFormID`,
           pendingFormData
      );
    }
  }

  socketListenToServer = () => {
    socketConnection.on('pendingFormID', data => {
      this.setState({socketResponse: data});
    });
  }

  socketConnect = () => {
    socketConnection = io.connect(ENDPOINT);
  }

  getPendingFormID = () => {
    const urlData = window.location.href.split('/');
    return urlData[urlData.length - 1];
  }

  setCurrentStep = () => {
    if (!window.localStorage.getItem(`step_${this.getPendingFormID()}`)) {
      window.localStorage.setItem(`step_${this.getPendingFormID()}`, this.state.step.toString());
    }

    //after removing page doesn't switch step immediately
    this.setState({
      step: parseInt(window.localStorage.getItem(`step_${this.getPendingFormID()}`), 10),
    });
  }

  setFormData = (data) => {
    window.localStorage.setItem(`data_${this.getPendingFormID()}`, JSON.stringify(data));
  }

  setKeyID = (id) => {
      this.setState({filledFormNumberID: id});
  }

  handleLoadSchema = () => {
    const id = this.props.match.params.formID;
    this.setState({formID: id});
    this.LoadSchema(id).then(r => console.log(r));
}

  LoadSchema = formID =>
      GetForm(formID, '/api/forms/templates/')
          .then(response => this.setState({formScheme: response.data}))
          .catch(error => console.error(`Błąd pobierania schematu: ${error}`));


  componentDidMount() {
    this.setCurrentStep();
    this.socketConnect();
    this.socketListenToServer();
    this.setKeyID(this.getPendingFormID());
    this.socketEmitData();
    //this.mountStep();
    this.handleLoadSchema();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.state.socketResponse.message === 'rejected') {
      this.setState({socketResponse: ''}, this.previousStep());
    }

    if (this.state.socketResponse.message === 'accepted')
      this.setState({socketResponse: ''}, this.nextStep());
  }

  promisedSetState = newState => {
    return new Promise(resolve => {
      this.setState(newState, () => {
        resolve();
      });
    });
  };

  handleSubmitSocket = async ({formData}) => {
    const pendingFormData = { // this is unecessary?
      dataForm: formData,
      templateID: this.state.formID,
      userID: this.state.formScheme.userID,
      filledFormNumberID: this.getPendingFormID(),
      state: '2'
    };

  //  await this.promisedSetState({pendingFormData: pendingFormData});
    this.setFormData(pendingFormData.dataForm)
    this.socketEmitData();
  };

  render() {
    const step = parseInt(window.localStorage.getItem(`step_${this.getPendingFormID()}`), 10);
    const {
      formScheme,
      formID,
      formDefault,
      filledFormNumberID,
      pendingFormData,
    } = this.state;
    const values = {
      formScheme,
      formID,
      formDefault,
      filledFormNumberID,
      pendingFormData,
    };
    switch (step) {
      case 1:
        return (
          <FormStep
            handleSubmitSocket={this.handleSubmitSocket}
            nextStep={this.nextStep}
            values={values}
            getPendingFormID={this.getPendingFormID}
          />
        );
      case 2:
        return <LockStep filledFormNumberID={this.state.filledFormNumberID} />;
      case 3:
        return <EndStep templateID={this.state.formID} />;
      default:
        return <h1>error </h1>;
    }
  }
}
export default UserForms;
