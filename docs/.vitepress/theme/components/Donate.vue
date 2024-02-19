<template>
  <div class="vp-doc" style="margin-bottom: 64px">
    <h2 id="写在最后" tabindex="-1">
      写在最后
      <a
        class="header-anchor"
        href="#写在最后"
        aria-label='Permalink to "写在最后"'
        >&ZeroWidthSpace;</a
      >
    </h2>
    码字不易，还请大家点击右上角为项目多多star，如果觉得文章质量不错的话，可以请作者喝杯咖啡，所有捐赠人员都会放入致谢中。非常感谢～
    <div class="donate">
      <Popover title="微信">
        <template #content>
          <Image
            :width="250"
            style="padding: 20px"
            :src="withBase('/images/wechatpay.jpeg')"
          />
        </template>
        <WechatOutlined :style="{ fontSize: '36px', color: '#64b687' }" />
      </Popover>
      <Popover title="支付宝">
        <template #content>
          <Image
            :width="250"
            style="padding: 0px 20px 20px 20px"
            :src="withBase('/images/alipay.jpeg')"
          />
        </template>
        <AlipayCircleOutlined :style="{ fontSize: '36px', color: '#08c' }" />
      </Popover>
    </div>
    也可关注我的公众号，会持续分享学习和生活的感悟~
    <div class="mp">
      <div>
        <Image
          :height="150"
          :src="withBase('/images/mp.png')"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { AlipayCircleOutlined, WechatOutlined } from "@ant-design/icons-vue";
import { Popover, Image } from "ant-design-vue";

// 静态资源需呀是用withBase()函数包起来。https://vitepress.docschina.org/guide/assets.html#base-url
import { withBase } from 'vitepress'

</script>
<style>
.donate {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-left: calc((100% - 150px) / 2);
  margin-right: calc((100% - 150px) / 2);
  margin-top: 8px;
  margin-bottom: 20px;
}

.mp {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
</style>
