<template>
  <view class="page">
    <scroll-view class="scroll" scroll-y>
      <view class="card">
        <view class="title">管理员功能说明</view>
        <view class="sub">以下规则以当前版本为准，建议在处理异常前先刷新一次数据。</view>
      </view>

      <view class="card">
        <view class="section-title">座位状态规则</view>
        <view class="line">1. 小程序组局预约优先于管理员手工状态，存在组局预约时不可手工覆盖。</view>
        <view class="line">2. 组局到达约定时间后，座位自动进入“使用中”。</view>
        <view class="line">3. 线下到店或人工预约可用手工状态标记，不会自动改为“使用中”。</view>
        <view class="line">4. 每天 18:00 后，系统会将“使用中”状态自动释放为“空闲中”。</view>
        <view class="line">5. 点击“清空当日手工状态”会清空当日手工标记，并强制释放当日“使用中”。</view>
      </view>

      <view class="card">
        <view class="section-title">荣誉榜管理</view>
        <view class="line">1. 支持新增、修改、删除荣誉记录。</view>
        <view class="line">2. 稀有度样式：金色传说、紫色史诗、蓝色稀有、白底黑框普通。</view>
      </view>

      <view class="card">
        <view class="section-title">百科与审核</view>
        <view class="line">1. 普通用户可投稿百科，默认状态为“待审核”。</view>
        <view class="line">2. 管理员可修改词条正文、状态（待审核/已发布/已驳回）并可调整创建者信息。</view>
        <view class="line">3. 仅“已发布”词条会在百科列表对全部用户展示。</view>
      </view>

      <view class="card">
        <view class="section-title">记录与组局管理</view>
        <view class="line">1. 战绩管理：可删除异常上报数据。</view>
        <view class="line">2. 组局管理：优先通过正常流程取消组局，避免直接删库导致追溯困难。</view>
      </view>

      <view class="card">
        <view class="section-title">用户昵称头像与标签管理</view>
        <view class="line">1. 已合并到“用户昵称头像管理”页面，在同一处可修改昵称、头像、自定义标签。</view>
        <view class="line">2. 系统推荐标签默认保留，仅建议调整用户自定义部分。</view>
        <view class="line">3. 修改后即时生效，建议保存前再次核对避免误改。</view>
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
