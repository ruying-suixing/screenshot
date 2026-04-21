<script setup lang="ts">
import { ref, watch } from 'vue';
import html2canvas from 'html2canvas';

//——————————————————————————————————————————————————————————————————————————————————————
const resetPreview = () => {
  activeDevice.value = ''
  coverShow.value = false
}
document.body.addEventListener('click', () => void resetPreview())

// 设备单独处理
enum Device {
  phone = 'phone',
  pad = 'pad',
  computer = 'computer',
  laptop = 'laptop' // 新增笔记本设备
}


const activeDevice = {

} = ref<Device | ''>('')

const handleActiveDevice = (device: Device) => {
  activeDevice.value = device;
  coverShow.value = true;
}

//——————————————————————————————————————————————————————————————————————————————————————

// 网址处理
const protocol = ref('https');     // 默认协议为 https
const url = ref('www.liushen.fun')
const phone = ref('')
const pad = ref('')
const computer = ref('')
const laptop = ref('')
const customURL = ref(false)

watch([phone, pad, computer], () => {
  url.value = ''
})

watch(url, (n) => {
  url.value = n.replace(/http(s?)\:\/\//, '')
})

// 滚动条处理
const scrollBar = ref(false)

const coverShow = ref(false)

// 协议切换
const toggleProtocol = () => {
  protocol.value = protocol.value === 'https' ? 'http' : 'https'
}

// 定位框功能
const positionBoxVisible = ref(false)
const positionBox = ref({
  x: 100,
  y: 100,
  width: 400,
  height: 300
})
const isDragging = ref(false)
const isResizing = ref(false)
const resizeCorner = ref('')
const dragStart = ref({ x: 0, y: 0, boxX: 0, boxY: 0, initialX: 0, initialY: 0 })
const positionCode = ref('')
const showPositionMenu = ref(false)
const isMenuVisible = ref(true) // 控制菜单显示/隐藏
const isMobileMenuOpen = ref(false) // 移动端菜单开关

// 从 localStorage 恢复定位框
const loadPositionFromStorage = () => {
  const saved = localStorage.getItem('positionBox')
  if (saved) {
    try {
      positionBox.value = JSON.parse(saved)
    } catch (e) {
      console.error('恢复定位框失败:', e)
    }
  }
}

// 保存定位框到 localStorage
const savePositionToStorage = () => {
  localStorage.setItem('positionBox', JSON.stringify(positionBox.value))
}

// 初始化时加载
loadPositionFromStorage()

// 监听定位框变化，自动保存
watch(positionBox, () => {
  savePositionToStorage()
}, { deep: true })

// 定位框功能
const togglePositionBox = () => {
  positionBoxVisible.value = !positionBoxVisible.value
}

const startDrag = (e: MouseEvent) => {
  isDragging.value = true
  dragStart.value = {
    x: e.clientX,
    y: e.clientY,
    boxX: positionBox.value.x,
    boxY: positionBox.value.y,
    initialX: 0,
    initialY: 0
  }
}

const onDrag = (e: MouseEvent) => {
  if (isDragging.value) {
    positionBox.value.x = dragStart.value.boxX + (e.clientX - dragStart.value.x)
    positionBox.value.y = dragStart.value.boxY + (e.clientY - dragStart.value.y)
  } else if (isResizing.value) {
    const dx = e.clientX - dragStart.value.x
    const dy = e.clientY - dragStart.value.y

    if (resizeCorner.value.includes('right')) {
      positionBox.value.width = Math.max(50, dragStart.value.boxX + dx)
    }
    if (resizeCorner.value.includes('left')) {
      const newWidth = Math.max(50, dragStart.value.boxX - dx)
      positionBox.value.x = dragStart.value.initialX + (dragStart.value.boxX - newWidth)
      positionBox.value.width = newWidth
    }
    if (resizeCorner.value.includes('bottom')) {
      positionBox.value.height = Math.max(50, dragStart.value.boxY + dy)
    }
    if (resizeCorner.value.includes('top')) {
      const newHeight = Math.max(50, dragStart.value.boxY - dy)
      positionBox.value.y = dragStart.value.initialY + (dragStart.value.boxY - newHeight)
      positionBox.value.height = newHeight
    }
  }
}

const endDrag = () => {
  isDragging.value = false
  isResizing.value = false
  resizeCorner.value = ''
}

const startResize = (corner: string, e: MouseEvent) => {
  e.stopPropagation()
  isResizing.value = true
  resizeCorner.value = corner
  
  // 保存初始位置用于调整
  const initialX = corner.includes('left') ? positionBox.value.x : 0
  const initialY = corner.includes('top') ? positionBox.value.y : 0
  
  dragStart.value = {
    x: e.clientX,
    y: e.clientY,
    boxX: positionBox.value.width,
    boxY: positionBox.value.height,
    initialX: initialX,
    initialY: initialY
  }
}

const exportPositionCode = () => {
  const screenInfo = {
    width: window.screen.width,
    height: window.screen.height,
    devicePixelRatio: window.devicePixelRatio
  }
  const data = {
    box: positionBox.value,
    screen: screenInfo
  }
  const code = btoa(JSON.stringify(data))
  positionCode.value = code
  navigator.clipboard.writeText(code)
  alert(`定位框代码已复制到剪贴板！\n\n当前分辨率：${screenInfo.width}x${screenInfo.height}\n缩放比例：${screenInfo.devicePixelRatio}\n\n提示：在相同分辨率和缩放比例下使用此代码，可获得最佳还原效果。`)
}

const importPositionCode = () => {
  const code = prompt('请输入定位框代码：')
  if (code) {
    try {
      const data = JSON.parse(atob(code))
      const currentScreen = {
        width: window.screen.width,
        height: window.screen.height,
        devicePixelRatio: window.devicePixelRatio
      }
      
      if (data.screen) {
        const isSameResolution = data.screen.width === currentScreen.width && 
                                 data.screen.height === currentScreen.height &&
                                 data.screen.devicePixelRatio === currentScreen.devicePixelRatio
        
        if (!isSameResolution) {
          const proceed = confirm(
            `警告：分辨率不匹配！\n\n` +
            `代码分辨率：${data.screen.width}x${data.screen.height} (缩放${data.screen.devicePixelRatio})\n` +
            `当前分辨率：${currentScreen.width}x${currentScreen.height} (缩放${currentScreen.devicePixelRatio})\n\n` +
            `定位框位置可能不准确，是否继续导入？`
          )
          if (!proceed) return
        }
      }
      
      positionBox.value = data.box || data
      positionBoxVisible.value = true
      alert('定位框已恢复！')
    } catch (e) {
      alert('代码格式错误！')
    }
  }
}

</script>

<template>
  <section class="main" @mousemove="onDrag" @mouseup="endDrag">
    <!-- 定位框 -->
    <div v-if="positionBoxVisible" class="position-box" :style="{
      left: positionBox.x + 'px',
      top: positionBox.y + 'px',
      width: positionBox.width + 'px',
      height: positionBox.height + 'px'
    }" @mousedown.stop="startDrag">
      <div class="corner top-left" @mousedown.stop="startResize('top-left', $event)"></div>
      <div class="corner top-right" @mousedown.stop="startResize('top-right', $event)"></div>
      <div class="corner bottom-left" @mousedown.stop="startResize('bottom-left', $event)"></div>
      <div class="corner bottom-right" @mousedown.stop="startResize('bottom-right', $event)"></div>
      <div class="position-label">定位框 {{ positionBox.width }}x{{ positionBox.height }}</div>
    </div>

    <!-- 预览覆盖背景 -->
    <transition name="fade">
      <div v-if="coverShow" class="cover">
        <div class="close-preview" @click="resetPreview"><i class="iconfont icon-cancel-1-copy"></i></div>
      </div>
    </transition>
    <div class="preview-box">
      <div class="computer" :class="{ active: activeDevice === Device.computer, activated: activeDevice }"
        @click.stop="handleActiveDevice(Device.computer)">
        <iframe :src="`${protocol}://${url || computer}`" frameborder="0" :scrolling="scrollBar ? 'yes' : 'no'"></iframe>
      </div>
      <div class="laptop" :class="{ active: activeDevice === Device.laptop, activated: activeDevice }"
        @click.stop="handleActiveDevice(Device.laptop)">
        <iframe :src="`${protocol}://${url || laptop}`" frameborder="0" :scrolling="scrollBar ? 'yes' : 'no'"></iframe>
      </div>

      <div class="phone" :class="{ active: activeDevice === Device.phone, activated: activeDevice }"
        @click.stop="handleActiveDevice(Device.phone)">
        <iframe :src="`${protocol}://${url || phone}`" frameborder="0" :scrolling="scrollBar ? 'yes' : 'no'"></iframe>
      </div>
      <div class="pad" :class="{ active: activeDevice === Device.pad, activated: activeDevice }"
        @click.stop="handleActiveDevice(Device.pad)">
        <iframe :src="`${protocol}://${url || pad}`" frameborder="0" :scrolling="scrollBar ? 'yes' : 'no'"></iframe>
      </div>
    </div>
    <!-- -------------------------------------------------------------- -->
    <!-- 移动端菜单按钮 -->
    <div class="mobile-menu-button" @click="isMobileMenuOpen = !isMobileMenuOpen" v-if="!activeDevice">
      <i class="iconfont" :class="isMobileMenuOpen ? 'icon-cancel-1-copy' : 'icon-icon_wangye'"></i>
    </div>
    
    <!-- 移动端全屏菜单遮罩 -->
    <transition name="fade">
      <div class="mobile-menu-overlay" v-if="isMobileMenuOpen" @click="isMobileMenuOpen = false"></div>
    </transition>
    
    <!-- 移动端全屏菜单 -->
    <transition name="slide-up">
      <div class="mobile-menu-panel" v-if="isMobileMenuOpen" @click.stop>
        <div class="mobile-menu-content">
          <!-- 网址 -->
          <div class="url">
            <div class="default">
              <span @click.stop="customURL = !customURL" class="website" :class="{ active: customURL }">
                <i class="iconfont icon-icon_wangye"></i> 网址</span>
              <span style="font-size: 14px; opacity: 0.7; margin-left: 8px;">{{protocol}}://</span>
              <input type="text" placeholder="请输入网址" v-model.trim="url" class="url" style="flex: 1; min-width: 0;">
            </div>
            <transition name="fade">
              <div class="custom" v-if="customURL">
                <div class="laptop">
                  <span><i class="iconfont icon-wangye"></i> 笔记本</span><span>{{ protocol }}://</span><input type="text"
                    placeholder="请输入网址" v-model.trim="laptop" class="url">
                </div>
                <div class="phone">
                  <span><i class="iconfont icon-shumashouji"></i> 手机</span><span>{{ protocol }}://</span><input type="text"
                    placeholder="请输入网址" v-model.trim="phone" class="url">
                </div>
                <div class="pad">
                  <span><i class="iconfont icon-pingban"></i> 平板</span><span>{{ protocol }}://</span><input type="text"
                    placeholder="请输入网址" v-model.trim="pad" class="url">
                </div>
                <div class="computer">
                  <span><i class="iconfont icon-diannao"></i> 电脑</span><span>{{ protocol }}://</span><input type="text"
                    placeholder="请输入网址" v-model.trim="computer" class="url">
                </div>
                <div class="close" @click="customURL = false"><i class="iconfont icon-cancel-1-copy"></i></div>
              </div>
            </transition>
          </div>
          <!-- 滚动条 -->
          <div class="control-item scroll-bar">
            <label>
              <div class="checkbox">
                <i class="iconfont" :class="scrollBar ? 'icon-yigouxuan' : 'icon-weigouxuan'"></i>
              </div>
              <span class="text">滚动条</span>
              <input type="checkbox" v-model="scrollBar" v-show="false" />
            </label>
          </div>
          <!-- 协议切换按钮 -->
          <div class="control-item protocol-toggle" @click="toggleProtocol">
            <div class="protocol-switch">
              <div class="protocol-indicator" :class="{ 'is-http': protocol === 'http' }"></div>
              <span class="protocol-text">{{ protocol.toUpperCase() }}</span>
            </div>
          </div>
          <!-- 定位框菜单 -->
          <div class="control-item position-menu" @click="showPositionMenu = !showPositionMenu">
            <div class="menu-trigger">
              <i class="iconfont icon-icon_wangye"></i>
              <span>定位框</span>
            </div>
            <transition name="slide-fade">
              <div v-if="showPositionMenu" class="menu-dropdown">
                <div class="menu-item" @click="togglePositionBox">
                  <i class="iconfont icon-icon_wangye"></i>
                  <span>{{ positionBoxVisible ? '隐藏' : '显示' }}</span>
                </div>
                <div class="menu-item" @click="exportPositionCode">
                  <i class="iconfont icon-icon_wangye"></i>
                  <span>导出</span>
                </div>
                <div class="menu-item" @click="importPositionCode">
                  <i class="iconfont icon-icon_wangye"></i>
                  <span>导入</span>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- 桌面端菜单 -->
    <transition name="fade">
      <div class="controls" v-if="!activeDevice">
        <!-- 网址 -->
        <div class="url">
          <div class="default">
            <span @click.stop="customURL = !customURL" class="website" :class="{ active: customURL }">
              <i class="iconfont icon-icon_wangye"></i> 网址</span>
            <transition name="fade">
              <div style="display: inline-block; margin-left: 8px;">
                <span style="font-size: 15px; opacity: 0.7;">{{protocol}}://</span>
                <input type="text" placeholder="请输入网址" v-model.trim="url" class="url">
              </div>
            </transition>
          </div>
          <transition name="fade">
            <div class="custom" v-if="customURL">
              <div class="laptop">
                <span><i class="iconfont icon-wangye"></i> 笔记本</span><span>{{ protocol }}://</span><input type="text"
                  placeholder="请输入网址" v-model.trim="laptop" class="url">
              </div>
              <div class="phone">
                <span><i class="iconfont icon-shumashouji"></i> 手机</span><span>{{ protocol }}://</span><input type="text"
                  placeholder="请输入网址" v-model.trim="phone" class="url">
              </div>
              <div class="pad">
                <span><i class="iconfont icon-pingban"></i> 平板</span><span>{{ protocol }}://</span><input type="text"
                  placeholder="请输入网址" v-model.trim="pad" class="url">
              </div>
              <div class="computer">
                <span><i class="iconfont icon-diannao"></i> 电脑</span><span>{{ protocol }}://</span><input type="text"
                  placeholder="请输入网址" v-model.trim="computer" class="url">
              </div>
              <div class="close" @click="customURL = false"><i class="iconfont icon-cancel-1-copy"></i></div>
            </div>
          </transition>
        </div>
        <!-- 滚动条 -->
        <div class="control-item scroll-bar">
          <label>
            <div class="checkbox">
              <i class="iconfont" :class="scrollBar ? 'icon-yigouxuan' : 'icon-weigouxuan'"></i>
            </div>
            <span class="text">滚动条</span>
            <input type="checkbox" v-model="scrollBar" v-show="false" />
          </label>
        </div>
        <!-- 协议切换按钮 -->
        <div class="control-item protocol-toggle" @click="toggleProtocol">
          <div class="protocol-switch">
            <div class="protocol-indicator" :class="{ 'is-http': protocol === 'http' }"></div>
            <span class="protocol-text">{{ protocol.toUpperCase() }}</span>
          </div>
        </div>
        <!-- 定位框菜单 -->
        <div class="control-item position-menu" @mouseenter="showPositionMenu = true" @mouseleave="showPositionMenu = false">
          <div class="menu-trigger">
            <i class="iconfont icon-icon_wangye"></i>
            <span>定位框</span>
          </div>
          <transition name="slide-fade">
            <div v-if="showPositionMenu" class="menu-dropdown">
              <div class="menu-item" @click="togglePositionBox">
                <i class="iconfont icon-icon_wangye"></i>
                <span>{{ positionBoxVisible ? '隐藏' : '显示' }}</span>
              </div>
              <div class="menu-item" @click="exportPositionCode">
                <i class="iconfont icon-icon_wangye"></i>
                <span>导出</span>
              </div>
              <div class="menu-item" @click="importPositionCode">
                <i class="iconfont icon-icon_wangye"></i>
                <span>导入</span>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </transition>
  </section>
</template>

<style lang="less">
* {
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translate(-50%, -100%);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  transform: translateY(100%);
}

.slide-up-leave-to {
  transform: translateY(100%);
}

body {
  color: #333;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  user-select: none;
  height: 100vh;
  background-color: white;
}

.main {
  margin: 0 auto;

  .cover {
    top: 0;
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 1);
    z-index: 100;

    .close-preview {
      position: fixed;
      width: fit-content;
      top: 40px;
      right: 40px;
      cursor: pointer;

      .iconfont {
        font-size: 26px;
      }
    }
  }

  .preview-box {
    position: relative;
    top: 200px;
    width: 1200px;
    height: 650px;
    left: 50%;
    transform: translate(-50%);
    display: flex;
    align-items: center;
    z-index: 105;
    transform-origin: 0 0;

    div {
      position: absolute;
      width: 100%;
      z-index: 1;
      overflow: hidden;
      transition: 0.5s ease;
      perspective: 1000;
      cursor: pointer;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      transform-style: preserve-3d;

      &.activated:not(.active) {
        opacity: 0;
        pointer-events: none;
      }

      iframe {
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: -1;
        left: 50%;
        border: 4px solid rgba(125, 125, 125, 0.1);

        ::-webkit-scrollbar body {
          display: none;
        }
      }
    }

    .computer {
      left: 50%;
      top: 0;
      width: 610px;
      height: 572px;
      background: url(./assets/images/new-model/computer.png) no-repeat 0 0/contain;
      transform-origin: center top;
      transform: translate(-50%);

      &.active {
        transform: translate(-50%) scale(1.2);
        z-index: 9999;
      }

      iframe {
        border-radius: 25px;
        top: 10px;
        width: 1340px;
        height: 876px;
        transform-origin: center top;
        transform: translate(-50%) scale(0.44);
      }
    }

    .laptop {
      top: 200px;
      left: 0px;
      width: 600px;
      height: 380px;
      background: url(./assets/images/new-model/laptop.png) no-repeat 0 0/contain;
      transform: scale(0.9);

      &.active {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(1.5);
        z-index: 9999;
      }

      iframe {
        border-radius: 18px 18px 5px 5px;
        top: 10px;
        width: 788px;
        height: 506px;
        transform-origin: center top;
        transform: translate(-50%) scale(0.6);
      }
    }


    .phone {
      top: 240px;
      z-index: 2;
      left: 56%;
      width: 168px;
      height: 350px;
      background: url(./assets/images/new-model/mobile.png) no-repeat 0 0/contain;
      transform: scale(0.8);

      &.active {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(2);
        z-index: 9999;
      }

      iframe {
        top: 6px;
        width: 407px;
        height: 877px;
        transform-origin: center top;
        transform: translate(calc(-50%)) scale(0.37);
        border-radius: 60px;
      }
    }

    .pad {
      top: 150px;
      left: 65%;
      width: 300px;
      height: 400px;
      background: url(./assets/images/new-model/tablet.png) no-repeat 0 0/contain;

      &.active {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(2);
        z-index: 9999;
      }

      iframe {
        top: 10px;
        width: 850px;
        height: 1120px;
        transform-origin: center top;
        transform: translate(calc(-50%)) scale(0.332);
        border-radius: 40px;
      }
    }
  }
  
  .menu-trigger-area {
    display: none;
  }
  
  .mobile-menu-button {
    display: none;
  }
  
  .mobile-menu-overlay {
    display: none;
  }
  
  .mobile-menu-panel {
    display: none;
  }

  .controls:not(iframe) {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: nowrap;
    gap: 12px;
    padding: 12px 24px;
    height: auto;
    width: 680px;
    color: rgba(255, 255, 255, 0.95);
    background: rgba(30, 30, 35, 0.85);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    user-select: none;
    z-index: 10010;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 
                0 1px 0 rgba(255, 255, 255, 0.1) inset;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    
    .menu-indicator {
      display: none;
    }
    
    .iconfont {
      font-size: 14px;
    }

    .control-item {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }
      
      &:active {
        transform: translateY(0);
      }
    }

    .url {
      display: flex;
      flex-direction: column;

      .website,
      .custom span:first-child {
        margin-right: 10px;

      }

      .website {
        cursor: pointer;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        &.active {
          font-weight: 400;

          input {
            opacity: 0.4;
          }
        }
      }

      .custom {
        position: absolute;
        top: 90px;
        background: rgba(30, 30, 35, 0.9);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.15);
        margin-left: -20px;
        padding: 16px 20px 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        border-radius: 16px;
        font-size: 14px;

        .close {
          margin-top: 8px;
          text-align: center;
          cursor: pointer;
          padding: 4px;
          border-radius: 8px;
          transition: all 0.2s ease;
          
          &:hover {
            background: rgba(255, 255, 255, 0.15);
          }
        }
      }

      input {
        display: inline-block;
        width: 120px;
        height: 30px;
        padding: 4px 10px 4px 0;
        margin-left: 2px;
        font-family: Avenir, Helvetica, Arial, sans-serif;
        font-size: 16px;
        color: rgba(255, 255, 255, 0.9);
        background: none;
        border: none;
        border-radius: 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        transition: border-color 0.3s ease;

        &::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        &:focus {
          outline: none;
          border-bottom-color: rgba(255, 255, 255, 0.5);
        }
      }

    }

    .protocol-toggle {
      position: relative;
      min-width: 90px;
      justify-content: center;
      
      .protocol-switch {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        
        .protocol-indicator {
          position: absolute;
          left: 0;
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          
          &.is-http {
            background: #fb923c;
            box-shadow: 0 0 8px rgba(251, 146, 60, 0.6);
          }
        }
        
        .protocol-text {
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.5px;
          margin-left: 12px;
        }
      }
    }

    .scroll-bar {
      label {
        display: flex;
        align-items: center;
        cursor: pointer;
        gap: 6px;
      }

      .checkbox {
        .iconfont {
          display: block;
          font-size: 14px;
          transition: all 0.2s ease;
        }
      }

      span.text {
        font-size: 14px;
      }
    }

    .position-menu {
      position: relative;
      
      .menu-trigger {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        
        span {
          font-weight: 500;
        }
      }
      
      .menu-dropdown {
        position: absolute;
        top: calc(100% + 12px);
        left: 50%;
        transform: translateX(-50%);
        background: rgba(30, 30, 35, 0.9);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        padding: 8px;
        min-width: 140px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 10020;
        
        .menu-item {
          padding: 10px 14px;
          font-size: 14px;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          gap: 10px;
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateX(2px);
          }
          
          .iconfont {
            font-size: 14px;
          }
          
          span {
            font-weight: 400;
          }
        }
      }
    }
  }
  
  .menu-trigger-area {
    display: none;
  }

  .position-box {
    position: fixed;
    border: 3px solid #4a9eff;
    background-color: transparent;
    z-index: 10001;
    cursor: move;
    box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.3), 0 0 20px rgba(74, 158, 255, 0.4);

    .position-label {
      position: absolute;
      top: -32px;
      left: 0;
      background: linear-gradient(135deg, #4a9eff 0%, #357abd 100%);
      color: white;
      padding: 5px 14px;
      border-radius: 6px;
      font-size: 12px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    .corner {
      position: absolute;
      width: 14px;
      height: 14px;
      background-color: #4a9eff;
      border: 3px solid white;
      border-radius: 50%;
      z-index: 10002;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.3);
        background-color: #357abd;
      }

      &.top-left {
        top: -7px;
        left: -7px;
        cursor: nw-resize;
      }

      &.top-right {
        top: -7px;
        right: -7px;
        cursor: ne-resize;
      }

      &.bottom-left {
        bottom: -7px;
        left: -7px;
        cursor: sw-resize;
      }

      &.bottom-right {
        bottom: -7px;
        right: -7px;
        cursor: se-resize;
      }
    }
  }


  @media screen and (max-width:1100px) {
    .preview-box {
      transform-origin: center 0;
      transform: translate(-50%) scale(0.9);
    }
  }

  @media screen and (max-width:1000px) {
    .preview-box {
      transform: translate(-50%) scale(0.8);
    }
  }

  @media screen and (max-width:900px) {
    .preview-box {
      transform: translate(-50%) scale(0.7);
    }
    
    .controls {
      display: none !important;
    }
    
    .mobile-menu-button {
      display: flex;
      align-items: center;
      justify-content: center;
      position: fixed;
      top: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: rgba(30, 30, 35, 0.9);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      cursor: pointer;
      z-index: 10015;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(30, 30, 35, 1);
        transform: scale(1.1);
      }
      
      &:active {
        transform: scale(0.95);
      }
      
      .iconfont {
        font-size: 24px;
        color: rgba(255, 255, 255, 0.95);
      }
    }
    
    .mobile-menu-overlay {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 10016;
    }
    
    .mobile-menu-panel {
      display: block;
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      max-height: 70vh;
      background: rgba(30, 30, 35, 0.95);
      backdrop-filter: blur(30px);
      border-radius: 24px 24px 0 0;
      z-index: 10017;
      overflow-y: auto;
      box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.3);
      
      .mobile-menu-content {
        padding: 24px 20px 40px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        
        .url {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 14px 16px;
          color: rgba(255, 255, 255, 0.95);
          
          .default {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: nowrap;
          }
          
          .website {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            cursor: pointer;
            white-space: nowrap;
            flex-shrink: 0;
          }
          
          input {
            flex: 1;
            min-width: 0;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 8px 10px;
            color: rgba(255, 255, 255, 0.95);
            font-size: 13px;
            
            &::placeholder {
              color: rgba(255, 255, 255, 0.5);
            }
            
            &:focus {
              outline: none;
              border-color: rgba(255, 255, 255, 0.4);
              background: rgba(255, 255, 255, 0.15);
            }
          }
          
          .custom {
            margin-top: 12px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            
            > div:not(.close) {
              display: flex;
              flex-direction: column;
              gap: 6px;
              
              span:first-child {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                opacity: 0.9;
              }
              
              input {
                width: 100%;
              }
            }
            
            .close {
              align-self: flex-end;
              cursor: pointer;
              padding: 8px;
              
              .iconfont {
                font-size: 20px;
              }
            }
          }
        }
        
        .control-item {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 14px 16px;
          color: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:active {
            transform: scale(0.98);
            background: rgba(255, 255, 255, 0.12);
          }
          
          label {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            cursor: pointer;
            
            .checkbox {
              display: flex;
              align-items: center;
              
              .iconfont {
                font-size: 20px;
              }
            }
            
            .text {
              font-size: 15px;
            }
          }
          
          &.protocol-toggle {
            justify-content: center;
            
            .protocol-switch {
              display: flex;
              align-items: center;
              gap: 8px;
              
              .protocol-text {
                font-size: 15px;
                font-weight: 500;
              }
            }
          }
          
          &.position-menu {
            flex-direction: column;
            align-items: stretch;
            
            .menu-trigger {
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 15px;
            }
            
            .menu-dropdown {
              position: static;
              margin-top: 12px;
              background: rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(255, 255, 255, 0.1);
              
              .menu-item {
                padding: 12px 14px;
                
                &:active {
                  background: rgba(255, 255, 255, 0.15);
                }
              }
            }
          }
        }
      }
    }
  }

  @media screen and (max-width:800px) {
    .preview-box {
      transform: translate(-50%) scale(0.6);
    }
  }

  @media screen and (max-width:700px) {
    .preview-box {
      transform: translate(-50%) scale(0.5);
    }
    
    .mobile-menu-button {
      top: 15px;
      right: 15px;
      width: 45px;
      height: 45px;
      
      .iconfont {
        font-size: 22px;
      }
    }
    
    .mobile-menu-panel {
      max-height: 75vh;
    }
  }

  @media screen and (max-width:600px) {
    .preview-box {
      transform: translate(-50%) scale(0.4);
    }
    
    .mobile-menu-button {
      top: 12px;
      right: 12px;
      width: 42px;
      height: 42px;
      
      .iconfont {
        font-size: 20px;
      }
    }
    
    .mobile-menu-panel {
      max-height: 80vh;
      
      .mobile-menu-content {
        padding: 20px 16px 36px;
        gap: 14px;
      }
    }
  }




}

</style>
