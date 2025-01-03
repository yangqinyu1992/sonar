// 人员搜索 2024-9-27
<div class="flex mr20">
<span>姓名：</span>
<WeaBrowser
  type={1}
  title="人力资源"
  tabs={[
    {
      name: getLabel(24515, "最近"),
      key: "1",
    },
    {
      name: getLabel(18511, "同部门"),
      key: "2",
    },
    {
      name: getLabel(15089, "我的下属"),
      key: "3",
    },
    {
      name: getLabel(18770, "按组织结构"),
      key: "4",
      browserProps: {
        browserTreeCustomProps: {
          defaultExpandedLevel: 2,
        },
      },
    },
    {
      name: getLabel(81554, "常用组"),
      key: "5",
    },
    {
      name: "所有人",
      key: "6",
    },
  ]}
  showDls
  isUseTest={true}
  isSingle={true}
  defaultCurrentUser={undefined}
  {...defaultBrowserParams}
  onChange={(v) => {
    this.setState({ xm: v });
  }}
/>
</div>