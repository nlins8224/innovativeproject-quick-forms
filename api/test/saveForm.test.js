const  {beforeAll} = require( "@jest/globals");
const mongoose = require('mongoose');
const Form = require('../src/models/filledForm.model');
const pendingForm = mongoose.model('pendingforms', Form);

beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__, { useNewUrlParser: true, useCreateIndex: true,
        useUnifiedTopology: true }, (err) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
    });
});


test('create & save form successfully', async () => {
    const formData = {
        state: 5,
        filledFormNumberID: 'aaa-bbb-ccc-ddd'
    }
    const form = new pendingForm(formData);
    const savedForm = await form.save();

    expect(savedForm._id).toBeDefined();
    expect(savedForm.filledFormNumberID).toBe(formData.filledFormNumberID);
    expect(savedForm.state).toBe(formData.state);
});
