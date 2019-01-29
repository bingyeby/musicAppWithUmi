import {connect} from 'dva';
import styles from './index.less';
import React from 'react'
import _ from 'lodash'
import DTitle from 'react-document-title'
import font from 'font-awesome/css/font-awesome.min.css'

import {AutoComplete, Input, Icon, message} from 'antd';

@connect((state) => {
  return {
    example: state.example,
    ...state.music,
  }
})
class Page extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      songSearchList: [],
      songSearchValue: ''
    }


    this.volumeValue = 1
  }

  componentDidMount() {
    this.audio = this.refs.audio
    this.audio.play()

    this.audio.addEventListener("timeupdate", () => {
      this.assignS('playInfo', {currentTime: this.audio.currentTime, duration: this.audio.duration})
    });

    this.audio.addEventListener("ended", () => {
      this.nextPlay()
    }, false);

    this.canvasDraw()


    this.xhr('songSearch', '落花').then((data) => {
      let songs = _.get(data, 'data.result.songs', [])
      console.log(`songs`, songs);
    })
  }

  componentDidUpdate() {
    if (this.props.playInfo.playStatus) {
      this.audio.play()
    } else {
      this.audio.pause();
    }

    if (this.props.settings.volumeOpen) {
      this.audio.volume = this.volumeValue
    } else {
      this.audio.volume = 0
    }
  }

  updateS = (moduleName, data) => {
    this.props.dispatch({
      type: 'music/updateState',
      payload: {
        moduleName,
        data,
      },
    })
  }

  assignS = (moduleName, data) => {
    this.props.dispatch({
      type: 'music/assignState',
      payload: {
        moduleName,
        data,
      },
    })
  }

  xhr = (moduleName, params) => {
    return this.props.dispatch({
      type: 'music/xhr',
      payload: {
        moduleName,
        params,
      },
    })
  }


  canvasDraw = (n, i) => {
    // https://www.cnblogs.com/Wayou/p/3543577.html
    let audioContext = new AudioContext(); //创建一个音乐对象
    // 创建获取频谱能量值的analyser节点
    let analyser = audioContext.createAnalyser();
    //创建音乐媒体源节点
    let audioSrc = audioContext.createMediaElementSource(this.audio);
    //将媒体源节点与分析机制链接
    audioSrc.connect(analyser);
    //将分析机制与目标点链接（扬声器）
    analyser.connect(audioContext.destination);


    let can = this.refs.canvasVoice;
    let cxt = can.getContext("2d");
    let colorUp = cxt.createLinearGradient(can.width * 0.5, 0, can.width * 0.5, 150);
    colorUp.addColorStop(0, "#00d1ff");
    colorUp.addColorStop(0.5, "#0095ff");
    colorUp.addColorStop(1, "#0065ff");
    let colorDown = cxt.createLinearGradient(can.width * .5, 150, can.width * .5, 250);
    colorDown.addColorStop(0, "#00d1ff");
    colorDown.addColorStop(0.5, "#0095ff");
    colorDown.addColorStop(1, "#0065ff");
    draw();

    function draw() {
      //创建一个与音乐频次等长的数组 【自动转换为0-255之间的数子】 analyser.frequencyBinCount 1024
      let byteData = new Uint8Array(analyser.frequencyBinCount);
      //将分析出来的音频数据添加到数组里面
      analyser.getByteFrequencyData(byteData);


      cxt.clearRect(0, 0, can.width, can.height);

      cxt.globalAlpha = 0.3;//透明度
      cxt.beginPath();

      let num = 1000;// 抽样数
      let step = Math.round(byteData.length / num);// 步长
      let stepWith = 0.38
      for (let i = 0; i < num; i++) {
        let value = (byteData[step * i]) / 2;
        cxt.fillStyle = colorUp;
        cxt.fillRect(i * stepWith + can.width * 0.49, 160, 10, -value + 1);// 0.49 0.51 用以错位
        cxt.fillRect(can.width * 0.51 - (i - 1) * stepWith, 160, -10, -value + 1);
        cxt.fillStyle = colorDown;
        cxt.fillRect(i * stepWith + can.width * 0.49, 160, 10, value * 0.6 + 1);
        cxt.fillRect(can.width * 0.51 - (i - 1) * stepWith, 160, -10, value * 0.6 + 1);
      }
      cxt.closePath();
      requestAnimationFrame(draw);
    }
  }

  volumeSizeMouseUp = (e) => {
    this.mouseInMark = false
    this.mouseDownInfo = null
  }

  volumeSizeMouseMove = (e) => {
    let originX = this.refs.volumeSize.getBoundingClientRect().x
    let originWith = this.refs.volumeSize.getBoundingClientRect().width
    if (this.mouseInMark) {
      let currentTime = ((e.clientX - originX) / originWith) * this.props.playInfo.duration
      this.updateS('playInfo.currentTime', currentTime)
      this.audio.currentTime = currentTime
    }
  }

  volumeSizeClick = (e) => {
    let originX = this.refs.volumeSize.getBoundingClientRect().x
    let originWith = this.refs.volumeSize.getBoundingClientRect().width
    let currentTime = ((e.clientX - originX) / originWith) * this.props.playInfo.duration
    this.updateS('playInfo.currentTime', currentTime)
    this.audio.currentTime = currentTime
  }

  volumeCurrentMarkMouseDown = (e) => {
    this.mouseInMark = true
    this.mouseDownInfo = {
      x: e.clientX
    }
  }

  volumeCurrentMarkMouseUp = (e) => {
    this.mouseInMark = false
    this.mouseDownInfo = null
  }


  /*
  * 播放列表中上一个
  * */
  prePlay = _.throttle(() => {
    let index = _.findIndex(this.props.defaultList, {active: true})
    if (index === 0) {
      index = _.size(this.props.defaultList) - 1
    } else {
      index--
    }
    _.each(this.props.defaultList, (n, i) => {
      n.active = false
    })
    this.props.defaultList[index].active = true
    this.updateS('defaultList', this.props.defaultList)
    this.updateS('playInfo', {
      currentTime: 0,
      duration: 0,
      playStatus: true,
      ...this.props.defaultList[index]
    })
  }, 800)
  /*
  * 播放列表中下一个
  * */
  nextPlay = _.throttle(() => {
    let index = _.findIndex(this.props.defaultList, {active: true})
    if (index === _.size(this.props.defaultList) - 1) {
      index = 0
    } else {
      index++
    }
    _.each(this.props.defaultList, (n, i) => {
      n.active = false
    })
    this.props.defaultList[index].active = true
    this.updateS('defaultList', this.props.defaultList)
    this.updateS('playInfo', {
      currentTime: 0,
      duration: 0,
      playStatus: true,
      ...this.props.defaultList[index]
    })
  }, 800)
  /*
  * 播放列表中的某个被点击歌曲
  * */
  defaultLiClick = (index) => {
    _.each(this.props.defaultList, (n, i) => {
      n.active = false
    })
    this.props.defaultList[index].active = true
    this.updateS('defaultList', this.props.defaultList)
    this.updateS('playInfo', {
      currentTime: 0,
      duration: 0,
      playStatus: true,
      ...this.props.defaultList[index]
    })
  }

  /*
  * 时间格式化  将秒单位的时间数格式化为:'02:03'
  * */
  timeFormat = (time) => {
    if (time === 0 || _.isNaN(time)) {
      return '00:00'
    }
    return `${Math.floor(time / 60)}`.padStart(2, '0') + ':' + `${Math.floor(time % 60)}`.padStart(2, '0')
  }


  lrcWrapRightMouseDown = (e) => {
    this.lrcWrapRightMouseMoving = true

  }
  lrcWrapRightMouseMove = (e) => {
    if (this.lrcWrapRightMouseMoving) {

    }
  }
  lrcWrapRightMouseUp = (e) => {
    this.lrcWrapRightMouseMoving = false
    this.lrcWrapRightMouseMovingBeginInfo = {
      y: e.clientY
    }
  }


  /*
  * 将lrc格式化输出
  * [{time:'11',value:'我有花一朵'}, ... ]
  * */
  formatLrc = (lrcStr = '') => {
    return lrcStr.split(/\[/gi).map((n, i) => {
      let timeValueArr = n.split(/\]/) // ['00:11.53', '我有花一朵']
      if (timeValueArr.length === 2 && /^\d{2}\:\d{2}\.\d{2,4}$/.test(timeValueArr[0])) {
        let timeArr = timeValueArr[0].split(".")[0].split(":");
        return {
          time: timeArr[0] * 60 + timeArr[1] * 1,
          value: timeValueArr[1]
        }
      } else {
        return null
      }
    }).filter((n, i) => {
      return n
    })
  }


  /*
  * 歌曲搜索节流
  * */
  songSearchThrottle = _.throttle((value) => {
    this.xhr('songSearch', value).then((data) => {
      let songs = _.slice(_.get(data, 'data.result.songs', []), 0, 10)
      this.setState({
        songSearchList: songs
      })
    })
  }, 1000)

  /*
  * 歌曲搜索
  * */
  songSearch = (value) => {
    this.setState({
      songSearchValue: value
    })
    this.songSearchThrottle(value)
  }

  /*
  * 选中搜索框中的某个值
  * */
  songSelect = (value) => {
    this.setState({
      songSearchValue: value
    })
    let selectInfo = _.find(this.state.songSearchList, {id: Number(value)})


    let resultInfo = {
      picUrl: selectInfo.al.picUrl,
      id: selectInfo.id,
      name: selectInfo.name,
      singer: _.map(selectInfo.ar, 'name').join(' ')
    }

    this.xhr('songGetWithId', value).then((data) => {
      resultInfo.src = _.get(data, 'data.data[0].url')
      if (!resultInfo.src) {
        message.error(`抱歉,无此歌曲播放地址`);
        return
      }
      this.xhr('songLyricGetWithId', value).then((lyricRespnse) => {
        resultInfo.lrc = _.get(lyricRespnse, 'data.lrc.lyric', '[00:00.00]未找到歌词')
        this.playAutoSong(resultInfo)
      }).catch((e) => {
        resultInfo.lrc = '[00:00.00]未找到歌词'
        this.playAutoSong(resultInfo)
      })
    })
  }

  /*
  * 直接播放 某个列表中不存在的 歌曲
  * */
  playAutoSong = (playInfo) => {
    _.each(this.props.defaultList, (n, i) => {
      n.active = false
    })
    this.updateS('defaultList', this.props.defaultList)
    this.updateS('playInfo', {
      currentTime: 0,
      duration: 0,
      playStatus: true,
      ...playInfo
    })
  }

  /*
  * 歌曲收藏
  * */
  songCollect = (n, i) => {
    let index = _.findIndex(this.props.defaultList, {name: this.props.playInfo.name})
    let resultCollect = !this.props.playInfo.collect
    this.updateS(`defaultList[${index}].collect`, resultCollect)
    this.updateS('playInfo.collect', resultCollect)
  }

  /*
  * 当前播放歌曲添加至播放列表
  * */
  songAdd = (playInfo) => {
    playInfo.active = true
    this.props.defaultList.push(_.omit(playInfo, ['currentTime', 'duration', 'playStatus',]))
    this.updateS('defaultList', this.props.defaultList)
  }

  render() {
    console.log(`this.props`, this.props);
    let playInfo = this.props.playInfo
    let formatLrcObj = this.formatLrc(playInfo.lrc)
    let lrcCurrentIndex = _.sortedIndex(_.map(formatLrcObj, 'time'), playInfo.currentTime * 1)
    return (
      <DTitle title='My Music App' className={styles.normal}>
        <div className={styles.outer}>
          <div className={styles.inner}>
            <div className={styles.header}>
              <div className={styles.title}>WELCOME</div>
              <div className={styles.search}>
                {/*<input type="text" placeholder="请输入要搜索的歌曲..."/>*/}
                {/*<a href="javascript:void(0)" title="搜索" id="search"/>*/}
                <AutoComplete
                  dataSource={this.state.songSearchList}
                  style={{width: 200}}
                  value={this.state.songSearchValue}
                  onSelect={this.songSelect}
                  onSearch={this.songSearch}
                  placeholder="请输入歌曲名称"
                >
                  {_.map(this.state.songSearchList, (n) => {
                    return <AutoComplete.Option key={n.id}>{`${n.name} ${n.alia.join('')}`}</AutoComplete.Option>
                  })}
                </AutoComplete>
              </div>
              <div className={styles.close}><i className={'fa fa-close'}></i></div>
            </div>
            <div className={styles.musicBody}>
              <div className={styles.left}>
                <div className={styles.defaultList}>
                  {
                    _.map(this.props.defaultList, (n, i) => {
                      return <span key={i} className={n.active ? styles.active : ''}
                                   onClick={this.defaultLiClick.bind(this, i)}>{n.name}</span>
                    })
                  }
                </div>
              </div>
              <div className={styles.right} onMouseMove={this.lrcWrapRightMouseMove} onMouseUp={this.lrcWrapRightMouseUp} onMouseDown={this.lrcWrapRightMouseDown}>
                <canvas ref="canvasVoice" className="canvas" width="600" height="300"></canvas>
                <div className={styles.lrcWrap} style={{transform: `translate(0,${-100 * lrcCurrentIndex / _.size(formatLrcObj)}%)`}}>
                  {
                    _.map(formatLrcObj, (n, i) => {
                      return <div key={i} style={lrcCurrentIndex - 1 === i ? {
                        fontSize: 18,
                        fontWeight: 'bolder'
                      } : {}}>{n.value}</div>
                    })
                  }
                </div>

              </div>
            </div>
            <div className={styles.footer}>
              <div className={styles.playOpt}>
                <div onClick={this.prePlay}><i className={'fa fa-step-backward'}></i></div>
                <div onClick={(e) => {
                  this.updateS('playInfo.playStatus', !playInfo.playStatus)
                }}><i className={`fa fa-2x ${playInfo.playStatus ? 'fa-pause' : 'fa-play'}`}></i>
                </div>
                <div onClick={this.nextPlay}><i className={'fa fa-step-forward'}></i></div>
              </div>
              <div className={styles.songMiniBill}>
                <img src={playInfo.picUrl} alt=""/>
              </div>
              <div className={styles.volumeSwitch} onClick={(n, i) => {
                if (this.props.settings.volumeOpen) {
                  this.volumeValue = this.audio.volume
                }
                this.assignS('settings.volumeOpen', !this.props.settings.volumeOpen)
              }}><i className={`fa ${this.props.settings.volumeOpen ? 'fa-volume-up' : 'fa-volume-off'}`}></i></div>
              <div className={styles.volumeSize} ref={'volumeSize'}
                   onMouseMove={this.volumeSizeMouseMove} onMouseUp={this.volumeSizeMouseUp} onClick={this.volumeSizeClick}>
                {/*标志线*/}
                <div className={styles.volumeCurrent} style={{width: `${100 * playInfo.currentTime / playInfo.duration}%`}}></div>
                {/*操作按钮*/}
                <div className={styles.volumeCurrentMark} style={{left: `${100 * playInfo.currentTime / playInfo.duration}%`}}
                     onMouseUp={this.volumeCurrentMarkMouseUp} onMouseDown={this.volumeCurrentMarkMouseDown}>
                </div>

                <div className={styles.songNameMini}>{playInfo.name}</div>
                <div className={styles.time}>{this.timeFormat(playInfo.currentTime)}/{this.timeFormat(playInfo.duration)}</div>
              </div>
              <div className={styles.collect} onClick={this.songAdd.bind(this, playInfo)} title={'添加至播放列表'}
                   style={{visibility: _.find(this.props.defaultList, {id: playInfo.id}) ? 'hidden' : ''}}>
                <i className={`fa fa-plus-square-o`}></i>
              </div>
              <div className={styles.collect} onClick={this.songCollect} title={'收藏'}>
                <i className={`fa ${this.props.playInfo.collect ? 'fa-heart' : 'fa-heart-o'}`}></i>
              </div>
            </div>
            <audio ref="audio" src={this.props.playInfo.src} crossOrigin="anonymous"></audio>
          </div>
        </div>
      </DTitle>
    )
  } ;
}

export default Page
