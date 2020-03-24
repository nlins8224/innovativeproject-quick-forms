import React, {Component} from 'react';
import {withTheme} from 'react-jsonschema-form';
import {Theme as MuiTheme} from 'rjsf-material-ui';
import {Button, Container} from '@material-ui/core';
import axios from 'axios';
import SubmitForm from '../SubmitForm/SubmitForm';

const Form = withTheme(MuiTheme);

export class UserForms extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formScheme: {},
    };
  }

  componentDidMount() {
    axios
      .get('/api/forms/5e738e611c9d4400008103ca')
      .then(response => {
        this.setState({formScheme: response.data});
      })
      .catch(error => {
        // handle error
        console.log(error);
      });
  }

  handleSubmit = ({formData}) => SubmitForm(formData, '/api/forms/aaa');

  render() {
    return (
      <Container ms={8}>
        <Form schema={this.state.formScheme} onSubmit={this.handleSubmit}>
          <Button variant="contained" color="primary" type="submit">
            Submit
          </Button>
        </Form>
      </Container>
    );
  }
}
export default UserForms;