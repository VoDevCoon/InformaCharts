import axios from 'axios';

const test = (req) => {
  axios.get(req)
    .then((res) => {
      console.log(res);
    });
};
