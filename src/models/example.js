export default {

  namespace: 'example',

  state: {
    a: '1'
  },

  subscriptions: {
    setup({dispatch, history}) {
    },
  },

  effects: {
    * fetch({payload}, {call, put}) {
      yield put({type: 'save'});
    },
  },

  reducers: {
    save(state, action) {
      return {...state, ...action.payload};
    },
  },

};
