var Messages = {
  uploaderShort:{
    title: 'Upload project',
    cont: 'You can upload a project as a csv and save it in your saved collection bellow.',
  },
  uploaderLong:{
    title: 'Instructions for uploading a project',
    cont: 'Only .csv files are supported <br> The column names should follow the following naming convension <br> For a Long formated file the .... lskf',
  },
  wrongFileFormat: {
    title:'Unable to Read File',
    error:'Wrong file format or missing values.'
  },
  projectRoute:{
    title: 'My Projects',
    cont: 'Welcome to our App, please browse your projects or upload a new one!',
  },
  toolsRoute: {
    title: 'Visualization Tools',
    cont: 'You now can use the tools provided for your project!',
  },
  aboutRoute: {
    title: 'The GRADE NMA project',
    cont: 'PLOS paper Abstract',
  },
  longFileUpload: {
    title: 'File uploaded!',
    cont: 'Your file seems ok! Fill in a project name and click save to add it to the Saved list',
  },
};

module.exports = () => {
  return Messages;
};
