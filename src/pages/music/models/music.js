import _ from 'lodash'


import axios from 'axios'

/*
* API: https://api.imjad.cn/cloudmusic.md
* https://api.imjad.cn/cloudmusic/?type=search&search_type=1004&s=%E8%90%BD%E8%8A%B1
* https://api.imjad.cn/cloudmusic/?type=song&id=259680&br=128000
* */

let songSearch = (search) => {
  return axios.get(`https://api.imjad.cn/cloudmusic/?type=search&s=${search}`)
}

let songGetWithId = (id) => {
  return axios.get(`https://api.imjad.cn/cloudmusic/?type=search&s=${id}`)
}


let defaultList = [
  {
    "name": "牵丝戏",
    active: true,
    "singer": "银临_Aki阿杰",
    "src": "/static/牵丝戏.mp3",
    "lrc": "[00:00.38]牵丝戏 - 银临&Aki阿杰 [00:00.64]词：Vagary [00:00.98]曲：银临 [00:24.27]嘲笑谁恃美扬威 [00:29.86]没了心如何相配 [00:34.53]盘铃声清脆 [00:37.44]帷幕间灯火幽微 [00:40.29]我和你 最天生一对 [00:46.56]没了你才算原罪 [00:52.20]没了心才好相配 [00:56.94]你褴褛我彩绘 [00:59.74]并肩行过山与水 [01:02.64]你憔悴 我替你明媚 [01:08.07]是你吻开笔墨 [01:11.21]染我眼角珠泪 [01:13.76]演离合相遇悲喜为谁 [01:19.30]他们迂回误会 [01:22.32]我却只由你支配 [01:25.02]问世间哪有更完美 [01:30.34]兰花指捻红尘似水 [01:35.80]三尺红台 万事入歌吹 [01:41.35]唱别久悲不成悲 [01:44.51]十分红处竟成灰 [01:47.34]愿谁记得谁 最好的年岁 [02:16.05]你一牵我舞如飞 [02:21.53]你一引我懂进退 [02:26.24]苦乐都跟随 [02:29.04]举手投足不违背 [02:31.90]将谦卑 温柔成绝对 [02:37.51]你错我不肯对 [02:40.20]你懵懂我蒙昧 [02:42.99]心火怎甘心扬汤止沸 [02:48.61]你枯我不曾萎 [02:51.58]你倦我也不敢累 [02:54.08]用什么暖你一千岁 [02:59.58]风雪依稀秋白发尾 [03:05.14]灯火葳蕤 揉皱你眼眉 [03:10.59]假如你舍一滴泪 [03:13.86]假如老去我能陪 [03:16.47]烟波里成灰 也去得完美 [03:21.94]风雪依稀秋白发尾 [03:27.39]灯火葳蕤 揉皱你眼眉 [03:33.05]假如你舍一滴泪 [03:36.17]假如老去我能陪 [03:38.93]烟波里成灰 也去得完美 [03:44.47]"
  },
  {
    "name": "一生等你",
    "singer": "袁娅维",
    "src": "/static/一生等你.mp3",
    "lrc": "[00:02.55]一生等你 (Cover：袁娅维) - 小Yuan元 [00:03.75]作词：陈曦 [00:05.08]作曲：陈曦&董冬冬 [00:24.96]铺陈纸笔 情字里写满你 [00:31.18]花开十里翩翩为你 [00:36.28]弹拨琴曲 如同身后站着你 [00:42.43]落雨一地痴痴等你 [00:48.13]用这一生一世一期一会的相遇 [00:53.18]换有你在身边的一幕朝夕 [00:59.26]就这一字一句一心一意的期许 [01:04.61]为和你屋檐下 听一场雨 [01:33.51]铺陈纸笔 情字里写满你 [01:39.63]花开十里翩翩为你 [01:44.73]弹拨琴曲 如同身后站着你 [01:51.08]落雨一地痴痴等你 [01:56.56]用这亦深亦浅亦近亦远的距离 [02:01.78]为遗憾和纠缠 添一抹诗意 [02:07.76]就这亦苦亦甜亦梦亦幻的缘起 [02:13.17]为和你刀剑下 饮酒欢愉 [02:19.58]用这一生一世一期一会的相遇 [02:24.61]换有你在身边的一幕朝夕 [02:30.69]就这一字一句一心一意的期许 [02:36.02]为和你屋檐下 听一场雨 [02:53.46]铺陈纸笔 情字里写满你 [02:59.66]花开十里翩翩为你 [03:04.80]弹拨琴曲 如同身后站着你 [03:11.18]落雨一地痴痴等你 [03:19.79]"
  }
]

export default {
  namespace: 'music',
  state: {
    defaultList: defaultList,
    playInfo: {/* name singer src lrc currentTime duration playStatus*/},
    settings: {
      volumeOpen: true,
      volumeValue: 1,
    },
    total: null,
    page: null,
  },
  reducers: {
    updateState(state, action) {
      let {payload} = action
      let returnState = {}
      _.set(state, payload.moduleName, null) // 清空原始值
      _.set(returnState, payload.moduleName, payload.data)
      return _.merge({}, state, returnState)
    },
    assignState(state, action) {
      let {payload} = action
      let returnState = {}
      _.set(returnState, payload.moduleName, payload.data)
      return _.merge({}, state, returnState)
    },
  },
  effects: {
    * xhr({payload: {moduleName, params, resolve}}, {call, put, select}) {
      let result = {}
      switch (moduleName) {
        case 'songSearch':
          return songSearch(params)
          break
        case 'songGetWithId':
          return songGetWithId(params)
          break

      }
      if (result.status === 0) {
        yield put({
          type: 'updateState',
          payload: {
            moduleName: moduleName,
            data: result.data,
          },
        })
      } else {
        console.error(`network err:[ ${moduleName} ]`)
      }
    }
  },
  subscriptions: {
    setup({dispatch, history}) {
    },
    initPlayInfo({dispatch, history}) {
      dispatch({
        type: 'updateState', payload: {
          moduleName: 'playInfo',
          data: {
            currentTime: 0,
            duration: 0,
            playStatus: true,
            ...defaultList[0]
          }
        }
      })
    }
  },
};
