import axios from 'axios';
import message from '../messages/messages';

async function checkCodewarsUser(codewarsId = 0) {
  return axios
    .get(`https://www.codewars.com/api/v1/users/${codewarsId}`, {
      validateStatus: function(status) {
        return status === 200 || status === 404; // Reject only if the status code is not 200 or 404
      },
    })
    .then(response => response.data)
    .catch(error => error);
}

export default checkCodewarsUser;
