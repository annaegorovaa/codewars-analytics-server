import User from '../userModel';
import message from '../../messages/messages';
import codewarsGetUser from '../../codewars/codewarsGetUser';

// 1. Get all users from Mongo
// 2. Cycle by id's
// 3. Get new codewars data
// 4. Update existing users

const userUpdateCwAll = async (req, res, next) => {
  // 1. Get users from Mongo
  const users = await getUserAll();

  if (users.message.type === 'error') {
    return res.status(400).json(message.error(users.message.text));
  }

  // Create array of promises
  const promises = [];

  await users.payload.forEach(async user => {
    promises.push(updateUserCodewarsData(user));
  });

  Promise.all(promises)
    .then(result => {
      return res.status(200).json(message.success(result));
    })
    .catch(err => {
      return res.status(400).json(message.error(err));
    });
};

function updateUserCodewarsData(user) {
  const userId = user._id;
  const codewarsId = user.codewarsId;

  // All promises are resolved, but different answers in resolve()
  return new Promise(async (resolve, rejected) => {
    // 3. Get new codewars data
    const codewarsUserNewData = await codewarsGetUser(codewarsId);
    if (codewarsUserNewData.message.type === 'success') {
      // 4. Update existing user
      const userUpdateResult = await userUpdate(
        userId,
        codewarsUserNewData.payload,
        user,
      );
      if (userUpdateResult.message.type === 'success') {
        resolve(message.success(userUpdateResult.message.text, userId));
      } else {
        resolve(message.error(userUpdateResult.message.text, userId));
      }
    } else {
      resolve(message.error(codewarsUserNewData.message.text, userId));
    }
  });
}

export function getUserAll() {
  return User.find()
    .select('-__v -password -email')
    .exec()
    .then(doc => message.success('Get all users OK', doc))
    .catch(() => {
      return message.error('Get all users ERROR');
    });
}

const userUpdate = (userId, codewarsUserData, user) => {
  const lastCodewarsRecordInUser =
    user.codewarsAnalytics[user.codewarsAnalytics.length - 1];
  const dayOfMonthCodewarsUpdate = new Date(lastCodewarsRecordInUser.timestamp).getDate(); // Day of month
  const currentDayOfMonth = new Date().getDate();

  // return message.success('User updated successfully ))');
  // Do update last record in codewars array in user
  if (currentDayOfMonth === dayOfMonthCodewarsUpdate) {
    return message.success('User data exist');
  } else {
    return User.update(
      { _id: userId },
      {
        $push: {
          codewarsAnalytics: {
            timestamp: Date.now(),
            data: codewarsUserData,
          },
        },
      },
    )
      .exec()
      .then(doc => {
        if (doc.n) {
          return message.success('User updated successfully');
        } else {
          return message.error('User not found');
        }
      })
      .catch(error => message.error('Update user error', error));
  }
};

export default userUpdateCwAll;
