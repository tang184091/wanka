<template>
  <view class="page">
    <scroll-view class="scroll" scroll-y>
      <view class="card">
        <view class="title">管理员功能说明</view>
        <view class="sub">以下为当前版本管理员能力说明，建议操作前先刷新页面，避免使用旧数据。</view>
      </view>

      <view class="card">
        <view class="section-title">1. 座位状态管理</view>
        <view class="line">1. 座位支持切换：空闲中 / 预约中 / 使用中。</view>
        <view class="line">2. 点击“保存所有修改”后，保存当日管理员手工状态。</view>
        <view class="line">3. 点击“清空当日手工状态”会清掉当日管理员手工覆盖，仅保留组局自动状态。</view>
        <view class="line">4. 建议优先通过组局流程管理线上预约，手工状态主要用于线下临时安排。</view>
      </view>

      <view class="card">
        <view class="section-title">2. 公告管理</view>
        <view class="line">1. 可在“公告管理”编写座位详情页底部公告。</view>
        <view class="line">2. 公告最多 1000 字，保存后全体用户可见。</view>
        <view class="line">3. 支持内容安全检查，不合规内容会阻止提交。</view>
      </view>

      <view class="card">
        <view class="section-title">3. 战绩与荣誉</view>
        <view class="line">1. 可管理玩家上传的战绩记录。</view>
        <view class="line">2. 荣誉榜支持新增、编辑、删除。</view>
        <view class="line">3. 荣誉稀有度支持：传说（金）、史诗（紫）、稀有（蓝）、普通（白底黑框）。</view>
      </view>

      <view class="card">
        <view class="section-title">4. 役满图片管理</view>
        <view class="line">1. 可查看并删除不合规或重复的役满上传。</view>
        <view class="line">2. 建议优先处理图片加载失败、内容错误等异常数据。</view>
      </view>

      <view class="card">
        <view class="section-title">5. 百科管理</view>
        <view class="line">1. 普通用户可投稿词条，管理员可审核、编辑、删除。</view>
        <view class="line">2. 词条列表可分页查看，详情页展示创建时间与创建者。</view>
        <view class="line">3. 仅已发布词条面向用户展示。</view>
      </view>

      <view class="card">
        <view class="section-title">6. 用户管理</view>
        <view class="line">1. 支持分页查看全部用户，搜索后进入用户编辑页。</view>
        <view class="line">2. 可修改头像、昵称和自定义标签。</view>
        <view class="line">3. 可设置黑名单与管理员权限（加冕管理员）。</view>
        <view class="line">4. 黑名单用户将被限制组局、上传战绩、投稿百科和修改昵称头像。</view>
      </view>

      <view class="card">
        <view class="section-title">7. 组局管理</view>
        <view class="line">1. 可删除异常组局与异常战绩数据。</view>
        <view class="line">2. 建议优先通过业务流程处理，再执行删除操作，避免误删有效数据。</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
</script>

<style scoped>
.page { min-height: 100vh; background:#f5f6f8; }
.scroll { height: 100vh; }
.card { margin:20rpx; background:#fff; border-radius:12rpx; padding:16rpx; border:1rpx solid #e5e7eb; }
.title { font-size:30rpx; font-weight:700; color:#111827; }
.sub { margin-top:8rpx; font-size:22rpx; color:#6b7280; line-height:1.6; }
.section-title { font-size:26rpx; font-weight:700; color:#111827; margin-bottom:8rpx; }
.line { font-size:23rpx; color:#374151; line-height:1.7; margin-top:6rpx; }
</style>
