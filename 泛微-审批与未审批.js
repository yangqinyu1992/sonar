const { WeaTable, WeaTools, Tooltip, WeaSelect } = ecCom;
const { Table, InputNumber, message, Pagination, Select } = antd;
const { callApi, viewer } = WeaTools;
let columns = []
let scroll = { x: "calc( 500px + 50%)", y:'calc(100vh - 300px)' }
const enmuType = {
  '1': '1,2,4,5',
  '2': 'tywz',
  '3': 'iii',
  '4': '3',
  '5': 'jywz'
}
const getRowSpanCount = (data, key, target) => {
  if (!Array.isArray(data)) return 1;
  data = data.map((item) => item[key]);
  let preValue = data[0];
  const res = [[preValue]];
  let index = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i] === preValue) {
      res[index].push(data[i]);
    } else {
      index += 1;
      res[index] = [];
      res[index].push(data[i]);
      preValue = data[i];
    }
  }
  const arr = [];
  res.forEach((item) => {
    const len = item.length;
    for (let i = 0; i < len; i++) {
      arr.push(i === 0 ? len : 0);
    }
  });
  return arr[target];
};
const options = [
      {
        key: 1,
        showname: "一农场"
      },
      {
        key: 3,
        showname: "三农场",
      },
      {
        key: 5,
        showname: "五农场",
      },
      {
        key: 7,
        showname: '七农场',
      },
       {
        key: 10,
        showname: '十农场',
      },
    ];
class ComYearTable extends React.Component {
  constructor(props) {
      super(props)
      this.state = {
      columns: [],
      page: 1,
      size: 10,
      mainFlowReqId: '',
      selectedRowKeys: [],
      dataSource: [],
      loading: false,
      pageData: [],
      tableData: [],
      ncmc: ''
    }
  }
  componentDidMount() {
    this.getData()
    // this.getReuestId()
    // this.setState({
    //   columns: this.props.columns,
    //   scroll: this.props.scroll
    // })
  }
  getReuestId = () => {
    const params = WfForm.getBaseInfo()
    this.state.mainFlowReqId = params.requestid
  }
  onView = (event) => {
    console.log(event, '===>event')
    window.ecCom.WeaTools.viewer(event);
  };
   getData = () => {
     console.log(this.props.materialClassify, 999)
    let that = this
    const { page, size } = this.state
    this.setState({loading: true})
    const dataParams = {
      pageNo: page,
      pageSize: size,
      ncmc: this.props.ncmc,
      materialClassify: this.props.materialClassify ? this.props.materialClassify : enmuType[this.props.type],
    }
    if(this.props.jhy) {
      dataParams.jhy = this.props.jhy
    }
    callApi(this.props.url, "get", dataParams ).then((res) => {
      // let arr = []
      // for (var i = 0; i < 10; i++) {
      //   arr = arr.concat(res.data);
      // }
      if(res.code == 200) {
        that.setState({
          dataSource: res.data,
          tableData: res.data,
          total: res.size,
          loading: false
          // selectData: ['',...res.ncmc]
          })
          this.props.getSelectData(res.ncmc, res.classList)
      } else {
          that.setState({loading: false})
          message.error(res.msg);
      }
    });
  };
  editData = (id, key, value) => {
    const params = {
      id: id,
      key: value,
    };
    $.ajax({
      type: "POST",
      url: "/api/ec/centralized/updateMainFlowDt2",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(params),
      success: (res) => {
        if (res.code == "200") {
          that.getData();
        } else {
          message.error(res.msg);
        }
      },
    });
  };
  getFilterData = () => {
    const { dataSource  } = this.state
    if(dataSource.length > 0) {
      let arr = dataSource.filter(item => item.ncmc == val)
      this.setState({
        dataSource:arr
      })
    }
  }
  pagination = () => {
    let that = this;
    const { page, size, total, data, dataSource } = this.state;
    return {
      current: page,
      size: size,
      total: total,
      showTotal: () => {
        return (
          <span>
            共 <span>{ total }</span> 条
          </span>
        );
      },
      showSizeChanger: true,
      showQuickJumper: true,
      onShowSizeChange(current, size) {
        that.setState(
          (state) => {
            return {
              page: current,
              size: size,
              dataSource: []
            };
          },
          () => {
            that.getData();
          }
        );
      },
      onChange(current, size) {
        that.setState(
          (state) => {
            return { page: current, dataSource: [] };
          },
          () => {
            that.getData();
          }
        );
      },
    };
  };
  getNum = (num) => {
    if(num) {
      const { size } = this.state
      return num % size == 0 ? num / size : num / size + 1
    } else {
      return 1
    }
   
  }
  // onPaginationChange = (current,size) => {
  //   const { tableData } = this.state
  //   this.setState({
  //     dataSource: []
  //   })
  //   this.setState({
  //     dataSource: that.getPageData(tableData, page, size),
  //     size: size
  //   })
  // }
  // getPageData = (tableData, current, size) => {
  //   setTimeout(() => {
  //     this.setState({
  //          dataSource: tableData.slice((current - 1) * size, (current - 1) * size + size)
  //     })
  //   },500)
  // }
  // onCurrent = (current) => {
  //    this.setState({
  //     dataSource: []
  //   })
  //   let that = this
  //   const { tableData, size } = this.state
  //   this.setState(() => {
  //     return {
  //       dataSource: [],
  //       page: current
  //     }
  //   }, () => {
  //     that.getPageData(tableData, current, size)
  //   })
  // }
  onLink = (item) => {
    if(!this.props.choose) {
      window.open(`/spa/workflow/index_form.jsp#/main/workflow/req?requestid=${item.lcxx}&isovertime=0&ismonitor=1`)
    }
  }
  render() {
     const {  selectedRowKeys, dataSource, tableData, loading, total, page,size, pageData } = this.state
     let that = this
     const rowSelection = {
      selectedRowKeys,
      onChange(selectedRowKey, selectedRows) {
        // if (selectedRows && selectedRows.length > 0) {
        //   let str = [];
        //   selectedRows.map((item) => {
        //     str.push(item.id);
        //   });
        //   that.setState({ ids: str, selectedRowKeys: selectedRowKey });
        // } else {
        //   that.setState({ selectedRowKeys: selectedRowKey });
        // }
        that.setState({ selectedRowKeys: selectedRowKey });
      },
      onSelect(record, selected, selectedRows) {
        // that.saveCheck([record.id], selected);
      },
      onSelectAll(selected, selectedRows, changeRows) {
        let arr = [];
        if (changeRows && changeRows.length > 0) {
          // changeRows.map((item) => {
          //   arr.push(item.id);
          // });
          // that.saveCheck(arr, selected);
        }
      },
    };
    switch (this.props.type) {
      case "1":
        scroll = { x: "calc( 500px + 50%)", y:'calc(100vh - 300px)' }
        columns = [
          {
            title: "",
            align: "center",
            // fixed: "left",
            children: [
              {
                title: "农场名称",
                dataIndex: "ncmc",
                key: "ncmc",
                width: 120,
                render(text, reacd, index) {
                let obj = {
                children: (
                  <Tooltip placement="top" title={text}>
                    <div className="sgnc" style={{ color: reacd.bhjgjson ? '#2E8FF4': '', cursor: !that.props.choose? 'pointer' :'' }} onClick={() => that.onLink(reacd)}>{text}</div>
                  </Tooltip>
                ),
                props: {
                  rowSpan: 0,
                },
              };
              obj.props.rowSpan = getRowSpanCount(dataSource,that.props.choose? "requestId" : "lcxx", index);
              return obj;
              },
              },
              {
                title: "物料预测类型",
                dataIndex: "bomlx",
                key: "bomlx",
                width: 100,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson ? '#2E8FF4': '' }}>{text}</div>
                }
              },
              {
                title: "种植面积（亩）",
                dataIndex: "zzmjm",
                key: "zzmjm",
                width: 120,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson ? '#2E8FF4': '' }}>{text}</div>
                }
              },
            ],
          },
          {
            title: "物料信息",
            align: "center",
            // fixed: "left",
            children: [
              {
                title: "物料编码",
                dataIndex: "wlbm",
                key: "wlbm",
                width: 100,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson ? '#2E8FF4': '' }}>{text}</div>
                }
              },
              {
                title: "物料名称",
                dataIndex: "wlmc",
                key: "wlmc",
                width: 130,
                render(text, reacd, index) {
                  return  <Tooltip placement="top" title={text}>
                    <div className="wlmc" style={{ color: reacd.bhjgjson ? '#2E8FF4': '' }}>{text}</div>
                  </Tooltip>;
              },
              },
              {
                title: "规格型号",
                dataIndex: "wlxh",
                key: "wlxh",
                width: 100,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson ? '#2E8FF4': '' }}>{text}</div>
                }
              },
              {
                title: "成分/含量",
                dataIndex: "cfhl",
                key: "cfhl",
                width: 100,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson ? '#2E8FF4': '' }}>{text}</div>
                }
              },
               {
                title: "单位",
                dataIndex: "dw",
                key: "dw",
                width: 100,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson ? '#2E8FF4': '' }}>{text}</div>
                }
              },
              {
                title: "图片",
                dataIndex: "wltp",
                key: "wltp",
                width: 80,
                render(text, recad, index) {
                  return text ? <img
                      style={{ width: "100%", height: "50px", cursor: "pointer" }}
                      className="previewImg formImgPlay"
                      data-type={{ text }}
                      data-imgsrc={text}
                      src={text}
                      onClick={(e) => that.onView(e)}
                    /> : <div style={{ height: "58px" }}></div>
                },
              },
              {
                title: "当前库存",
                dataIndex: "kc",
                key: "kc",
                width: 80,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson ? '#2E8FF4': '' }}>{text}</div>
                }
              },
              {
                title: "采购未清",
                dataIndex: "wqsl",
                key: "wqsl",
                width: 80,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson ? '#2E8FF4': '' }}>{text}</div>
                }
              },
            ],
          },
          {
            title: "",
            children: [
              {
                title: "用途、作用",
                dataIndex: "ytzy",
                key: "ytzy",
                width: 100,
              },
              // {
              //   title: "亩均用量",
              //   dataIndex: "mjyl",
              //   key: "mjyl",
              //   width: 100,
              //   render(text, recad, index) {
              //     return <div
              //         style={{ height: "58px", lineHeight: '58px', textAlign: 'center' }}
              //       >{ text }</div>
              //   },
              // },
              {
                title: "预计使用月份",
                dataIndex: "yjsyyf",
                key: "yjsyyf",
                width: 120,
                render(text, reacd, index) {
                  return  <Tooltip placement="top" title={text}>
                    <div className="wlmc">{text}</div>
                  </Tooltip>;
              },
              },
              {
                title: "上一年整年用量",
                dataIndex: "ndtqlsly",
                key: "ndtqlsly",
                width: 120,
              },
            ],
          },
          {
            title: "年度合计",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "ndtqlsly",
                key: "ndtqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "ndxqycsl",
                key: "ndxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "7月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "qytqlsly",
                key: "qytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "qyxqycsl",
                key: "qyxqycsl",
                width: 100,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson.includes('qyxqycsl') ? '#2E8FF4': '' }}>{text}</div>
                }
              },
            ],
          },
          {
            title: "8月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "bytqlsly",
                key: "bytqlsly",
                width: 100,
                
              },
              {
                title: "需求预测",
                dataIndex: "byxqycsl",
                key: "byxqycsl",
                width: 100,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson.includes('byxqycsl') ? '#2E8FF4': '' }}>{text}</div>
                }
              },
            ],
          },
          {
            title: "9月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "jytqlsly",
                key: "jytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "jyxqycsl",
                key: "jyxqycsl",
                width: 100,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson.includes('jyxqycsl') ? '#2E8FF4': '' }}>{text}</div>
                }
              },
            ],
          },
          {
            title: "10月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "sytqlsly2",
                key: "sytqlsly2",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "syxqycsl2",
                key: "syxqycsl2",
                width: 100,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson.includes('syxqycsl2') ? '#2E8FF4': '' }}>{text}</div>
                }
              },
            ],
          },
          {
            title: "11月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "syytqlsly",
                key: "syytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "syyxqycsl",
                key: "syyxqycsl",
                width: 100,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson.includes('syyxqycsl') ? '#2E8FF4': '' }}>{text}</div>
                }
              },
            ],
          },
          {
            title: "12月",
            align: 'center',
            children: [
              {
                title: "同期历史领用",
                dataIndex: "seytqlsly",
                key: "seytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "seyxqycsl",
                key: "seyxqycsl",
                width: 100,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson.includes('seyxqycsl') ? '#2E8FF4': '' }}>{text}</div>
                }
              },
            ],
          },
          {
            title: "01月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "yytqlsly",
                key: "yytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "yyxqycsl",
                key: "yyxqycsl",
                width: 100,
                render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson.includes('yyxqycsl') ? '#2E8FF4': '' }}>{text}</div>
                }
              },
            ],
          },
          {
            title: "02月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "eytqlsly",
                key: "eytqlsly",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "eyxqycsl",
                key: "eyxqycsl",
                 width: 100,
                 render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson.includes('eyxqycsl') ? '#2E8FF4': '' }}>{text}</div>
                }
              },
            ],
          },
          {
            title: "03月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "sytqlsly",
                key: "sytqlsly",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "syxqycsl",
                key: "syxqycsl",
                 width: 100,
                 render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson.includes('syxqycsl') ? '#2E8FF4': '' }}>{text}</div>
                }
              },
            ],
          },
          {
            title: "04月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "sytqlsly1",
                key: "sytqlsly1",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "syxqycsl1",
                key: "syxqycsl1",
                 width: 100,
                 render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson.includes('syxqycsl1') ? '#2E8FF4': '' }}>{text}</div>
                }
              },
            ],
          },
          {
            title: "05月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "wytqlsly",
                key: "wytqlsly",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "wyxqycsl",
                key: "wyxqycsl",
                 width: 100,
                 render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson.includes('wyxqycsl') ? '#2E8FF4': '' }}>{text}</div>
                }
              },
            ],
          },
          {
            title: "06月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "lytqlsly",
                key: "lytqlsly",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "lyxqycsl",
                key: "lyxqycsl",
                 width: 100,
                 render(text, reacd, index) {
                  return <div style={{ color: reacd.bhjgjson.includes('lyxqycsl') ? '#2E8FF4': '' }}>{text}</div>
                }
              },
            ],
          },
           {
            title: "备注",
            dataIndex: "bz",
            key: "bz",
            width: 100,
          },
        ];
        break;
      case "2":
        scroll = { x: "calc( 500px + 50%)", y:'calc(100vh - 300px)' }
        columns = [
          {
            title: "",
            align: "center",
            // fixed: "left",
            children: [
              {
                title: "农场名称",
                dataIndex: "ncmc",
                key: "ncmc",
                width: 120,
                render(text, reacd, index) {
                let obj = {
                children: (
                  <Tooltip placement="top" title={text}>
                    <div className="sgnc" onClick={() => that.onLink(reacd)}>{text}</div>
                  </Tooltip>
                ),
                props: {
                  rowSpan: 0,
                },
              };
              obj.props.rowSpan = getRowSpanCount(dataSource, this.props.choose? "requestId" : "lcxx", index);
              return obj;
              },
              },
              {
                title: "种植面积（亩）",
                dataIndex: "zzmjm",
                key: "zzmjm",
                width: 120,
              },
            ],
          },
          {
            title: "物料信息",
            align: "center",
            // fixed: "left",
            children: [
              {
                title: "物料编码",
                dataIndex: "wlbm",
                key: "wlbm",
                width: 100,
              },
              {
                title: "物料名称",
                dataIndex: "wlmc",
                key: "wlmc",
                width: 130,
                render(text, reacd, index) {
                  return  <Tooltip placement="top" title={text}>
                    <div className="sgnc">{text}</div>
                  </Tooltip>;
              },
              },
              {
                title: "规格型号",
                dataIndex: "wlxh",
                key: "wlxh",
                width: 100,
              },
              {
                title: "成分/含量",
                dataIndex: "cfhl",
                key: "cfhl",
                width: 100,
              },
               {
                title: "单位",
                dataIndex: "dw",
                key: "dw",
                width: 100,
              },
              {
                title: "图片",
                dataIndex: "wltp",
                key: "wltp",
                width: 80,
                render(text, recad, index) {
                  return <img
                      style={{ width: "100%", height: "10px", cursor: "pointer" }}
                      className="previewImg formImgPlay"
                      data-type={{ text }}
                      data-imgsrc={text}
                      src={text}
                      onClick={(e) => that.onView(e)}
                    />
                },
              },
              {
                title: "当前库存",
                dataIndex: "kc",
                key: "kc",
                width: 80,
              },
              {
                title: "采购未清",
                dataIndex: "wqsl",
                key: "wqsl",
                width: 80,
              },
            ],
          },
          {
            title: "",
            children: [
              {
                title: "用途、作用",
                dataIndex: "ytzy",
                key: "ytzy",
                width: 100,
              },
              // {
              //   title: "亩均用量",
              //   dataIndex: "mjyl",
              //   key: "mjyl",
              //   width: 100,
              // },
              {
                title: "预计使用月份",
                dataIndex: "yjsyyf",
                key: "yjsyyf",
                width: 100,
              },
              {
                title: "上一年整年用量",
                dataIndex: "cfhl",
                key: "cfhl",
                width: 120,
              },
            ],
          },
          {
            title: "年度合计",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "seytqlsly",
                key: "seytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "seyxqycsl",
                key: "seyxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "7月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "qytqlsly",
                key: "qytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "qyxqycsl",
                key: "qyxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "8月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "bytqlsly",
                key: "bytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "byxqycsl",
                key: "byxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "9月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "jytqlsly",
                key: "jytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "jyxqycsl",
                key: "jyxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "10月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "sytqlsly2",
                key: "sytqlsly2",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "syxqycsl2",
                key: "syxqycsl2",
                width: 100,
              },
            ],
          },
          {
            title: "11月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "syytqlsly",
                key: "syytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "syyxqycsl",
                key: "syyxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "12月",
            align: 'center',
            children: [
              {
                title: "同期历史领用",
                dataIndex: "seytqlsly",
                key: "seytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "seyxqycsl",
                key: "seyxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "01月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "yytqlsly",
                key: "yytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "yyxqycsl",
                key: "yyxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "02月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "eytqlsly",
                key: "eytqlsly",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "eyxqycsl",
                key: "eyxqycsl",
                 width: 100,
              },
            ],
          },
          {
            title: "03月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "sytqlsly",
                key: "sytqlsly",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "syxqycsl",
                key: "syxqycsl",
                 width: 100,
              },
            ],
          },
          {
            title: "04月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "sytqlsly1",
                key: "sytqlsly1",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "syxqycsl1",
                key: "syxqycsl1",
                 width: 100,
              },
            ],
          },
          {
            title: "05月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "wytqlsly",
                key: "wytqlsly",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "wyxqycsl",
                key: "wyxqycsl",
                 width: 100,
              },
            ],
          },
          {
            title: "06月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "lytqlsly",
                key: "lytqlsly",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "lyxqycsl",
                key: "lyxqycsl",
                 width: 100,
              },
            ],
          },
          {
            title: "备注",
            dataIndex: "bz",
            key: "bz",
            width: 100,
          },
        ];
        break;
      case "3":
        scroll = { x: true, y:'calc(100vh - 300px)' }
        columns = [
         {
                title: "农场名称",
                dataIndex: "ncmc",
                key: "ncmc",
                width: 120,
                fixed: "left",
                render(text, reacd, index) {
                let obj = {
                children: (
                  <Tooltip placement="top" title={text}>
                    <div className="sgnc">{text}</div>
                  </Tooltip>
                ),
                props: {
                  rowSpan: 0,
                },
              };
              obj.props.rowSpan = getRowSpanCount(dataSource,"ncmc", index);
              return obj;
              },
              },
              {
                title: "种植面积（亩）",
                dataIndex: "zzmjm",
                fixed: "left",
                key: "zzmjm",
                width: 120,
          },
          {
                title: "物料编码",
                dataIndex: "wlbm",
                fixed: "left",
                key: "wlbm",
                width: 100,
              },
              {
                title: "物料名称",
                dataIndex: "wlmc",
                fixed: "left",
                key: "wlmc",
                width: 130,
                render(text, reacd, index) {
                  return  <Tooltip placement="top" title={text}>
                    <div className="sgnc">{text}</div>
                  </Tooltip>;
              },
              },
              {
                title: "规格型号",
                dataIndex: "wlxh",
                key: "wlxh",
                fixed: "left",
                width: 100,
              },
              {
                title: "物料分类",
                dataIndex: "wlfl",
                fixed: "left",
                key: "wlfl",
                width: 100,
              },
               {
                title: "单位",
                dataIndex: "dw",
                fixed: "left",
                key: "dw",
                width: 100,
              },
              {
                title: "单价",
                dataIndex: "dj",
                fixed: "left",
                key: "dj",
                width: 100,
              },
              {
                title: "图片",
                dataIndex: "wltp",
                fixed: "left",
                key: "wltp",
                width: 80,
                render(text, recad, index) {
                  return <img
                      style={{ width: "100%", height: "10px", cursor: "pointer" }}
                      className="previewImg formImgPlay"
                      data-type={{ text }}
                      data-imgsrc={text}
                      src={text}
                      onClick={(e) => that.onView(e)}
                    />
                },
              },
              
              // {
              //   title: "亩均用量",
              //   dataIndex: "mjyl",
              //   key: "mjyl",
              //   width: 100,
              // },
              {
                title: "采购未清",
                dataIndex: "wqsl",
                key: "wqsl",
                width: 80,
              },
              {
                title: "7月",
                dataIndex: "qyxqycsl",
                key: "qyxqycsl",
                width: 100
              },
              {
                title: "8月",
                dataIndex: "byxqycsl",
                key: "byxqycsl",
                width: 100
              },
              {
                title: "9月",
                dataIndex: "jyxqycsl",
                key: "jyxqycsl",
                width: 100
              },
              {
                title: "10月",
                dataIndex: "syxqycsl2",
                key: "syxqycsl2",
                width: 100
              },
              {
                title: "11月",
                dataIndex: "syyxqycsl",
                key: "syyxqycsl",
                width: 100
              },
              {
                title: "12月",
                dataIndex: "seyxqycsl",
                key: "seyxqycsl",
                width: 100
              },
              {
                title: "1月",
                dataIndex: "yyxqycsl",
                key: "yyxqycsl",
                width: 100
              },
              {
                title: "2月",
                dataIndex: "eyxqycsl",
                key: "eyxqycsl",
                width: 100
              },
              {
                title: "3月",
                dataIndex: "syxqycsl",
                key: "syxqycsl",
                width: 100
              },
              {
                title: "4月",
                dataIndex: "syxqycsl1",
                key: "syxqycsl1",
                width: 100
              },
              {
                title: "5月",
                dataIndex: "wyxqycsl",
                key: "wyxqycsl",
                width: 100
              },
              {
                title: "6月",
                dataIndex: "lyxqycsl",
                key: "lyxqycsl",
                width: 100
              },
        ]
        break;
        case "4":
        scroll = { x: "calc( 500px + 50%)", y:'calc(100vh - 300px)' }
        columns = [
          {
            title: "加工厂名称",
            dataIndex: "ncmc",
            key: "ncmc",
            width: 120,
            render(text, reacd, index) {
                let obj = {
                children: (
                  <Tooltip placement="top" title={text}>
                    <div className="sgnc" style={{ color: reacd.bhjgjson ? '#2E8FF4': '', cursor: !that.props.choose? 'pointer' :'' }} onClick={() => that.onLink(reacd)}>{text}</div>
                  </Tooltip>
                ),
                props: {
                  rowSpan: 0,
                },
              };
              obj.props.rowSpan = getRowSpanCount(dataSource,that.props.choose? "requestId" : "lcxx", index);
              return obj;
              },
            // render(text, reacd, index) {
            //   return <Tooltip placement="top" title={text}>
            //         <div className="sgnc" style={{ color: reacd.bhjgjson ? '#2E8FF4': '', cursor: !that.props.choose? 'pointer' :'' }} onClick={() => that.onLink(reacd)}>{text}</div>
            //       </Tooltip>
            // }
          },
          {
            title: "物料名称",
            dataIndex: "wlmc",
            key: "wlmc",
            width: 100

          },
          {
            title: "单位",
            dataIndex: "dw",
            key: "dw",
             width: 80
          },
          {
                title: "吨均用量",
                dataIndex: "mjyl",
                key: "mjyl",
                width: 100
            },
             {
                title: "7月",
                dataIndex: "qyxqycsl",
                key: "qyxqycsl",
                width: 100
              },
              {
                title: "8月",
                dataIndex: "byxqycsl",
                key: "byxqycsl",
                width: 100
              },
              {
                title: "9月",
                dataIndex: "jyxqycsl",
                key: "jyxqycsl",
                width: 100
              },
              {
                title: "10月",
                dataIndex: "syxqycsl2",
                key: "syxqycsl2",
                width: 100
              },
              {
                title: "11月",
                dataIndex: "syyxqycsl",
                key: "syyxqycsl",
                width: 100
              },
               {
                title: "12月",
                dataIndex: "seyxqycsl",
                key: "seyxqycsl",
                width: 100
              },
              {
                title: "1月",
                dataIndex: "yyxqycsl",
                key: "yyxqycsl",
                width: 100
              },
               {
                title: "2月",
                dataIndex: "eyxqycsl",
                key: "eyxqycsl",
                width: 100
              },
               {
                title: "3月",
                dataIndex: "syxqycsl",
                key: "syxqycsl",
                width: 100
              },
               {
                title: "4月",
                dataIndex: "syxqycsl1",
                key: "syxqycsl1",
                width: 100
              },
               {
                title: "5月",
                dataIndex: "wyxqycsl",
                key: "wyxqycsl",
                width: 100
              },
               {
                title: "6月",
                dataIndex: "lyxqycsl",
                key: "lyxqycsl",
                width: 100
              },
              {
                title: "合计",
                dataIndex: "ndxqycsl",
                key: "ndxqycsl",
                width: 100
              },
         
          {
            title: "备注",
            dataIndex: "bz",
            key: "bz",
            width: 120,
          },
        ];
        break;
        case "5":
        scroll = { x: "calc( 500px + 50%)", y:'calc(100vh - 300px)' }
        columns = [
          {
            title: "",
            align: "center",
            // fixed: "left",
            children: [
              {
                title: "农场名称",
                dataIndex: "ncmc",
                key: "ncmc",
                width: 120,
                render(text, reacd, index) {
                let obj = {
                children: (
                  <Tooltip placement="top" title={text}>
                    <div className="sgnc">{text}</div>
                  </Tooltip>
                ),
                props: {
                  rowSpan: 0,
                },
              };
              obj.props.rowSpan = getRowSpanCount(dataSource,"ncmc", index);
              return obj;
              },
              },
              {
                title: "种植面积（亩）",
                dataIndex: "zzmjm",
                key: "zzmjm",
                width: 120,
              },
            ],
          },
          {
            title: "物料信息",
            align: "center",
            // fixed: "left",
            children: [
              {
                title: "物料编码",
                dataIndex: "wlbm",
                key: "wlbm",
                width: 100,
              },
              {
                title: "物料名称",
                dataIndex: "wlmc",
                key: "wlmc",
                width: 130,
                render(text, reacd, index) {
                  return  <Tooltip placement="top" title={text}>
                    <div className="wlmc">{text}</div>
                  </Tooltip>;
              },
              },
              {
                title: "规格型号",
                dataIndex: "wlxh",
                key: "wlxh",
                width: 100,
              },
              {
                title: "成分/含量",
                dataIndex: "cfhl",
                key: "cfhl",
                width: 100,
              },
               {
                title: "单位",
                dataIndex: "dw",
                key: "dw",
                width: 100,
              },
              {
                title: "图片",
                dataIndex: "wltp",
                key: "wltp",
                width: 80,
                render(text, recad, index) {
                  return text ? <img
                      style={{ width: "100%", height: "50px", cursor: "pointer" }}
                      className="previewImg formImgPlay"
                      data-type={{ text }}
                      data-imgsrc={text}
                      src={text}
                      onClick={(e) => that.onView(e)}
                    /> : <div style={{ height: "58px" }}></div>
                },
              },
              {
                title: "当前库存",
                dataIndex: "kc",
                key: "kc",
                width: 80,
              },
              {
                title: "采购未清",
                dataIndex: "wqsl",
                key: "wqsl",
                width: 80,
              },
            ],
          },
          {
            title: "",
            children: [
              {
                title: "用途、作用",
                dataIndex: "ytzy",
                key: "ytzy",
                width: 100,
              },
              // {
              //   title: "亩均用量",
              //   dataIndex: "mjyl",
              //   key: "mjyl",
              //   width: 100,
              //   render(text, recad, index) {
              //     return <div
              //         style={{ height: "58px", lineHeight: '58px', textAlign: 'center' }}
              //       >{ text }</div>
              //   },
              // },
              {
                title: "预计使用月份",
                dataIndex: "yjsyyf",
                key: "yjsyyf",
                width: 100,
              },
              {
                title: "上一年整年用量",
                dataIndex: "cfhl",
                key: "cfhl",
                width: 120,
              },
            ],
          },
          {
            title: "年度合计",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "seytqlsly",
                key: "seytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "seyxqycsl",
                key: "seyxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "7月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "qytqlsly",
                key: "qytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "qyxqycsl",
                key: "qyxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "8月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "bytqlsly",
                key: "bytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "byxqycsl",
                key: "byxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "9月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "jytqlsly",
                key: "jytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "jyxqycsl",
                key: "jyxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "10月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "sytqlsly2",
                key: "sytqlsly2",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "syxqycsl2",
                key: "syxqycsl2",
                width: 100,
              },
            ],
          },
          {
            title: "11月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "syytqlsly",
                key: "syytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "syyxqycsl",
                key: "syyxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "12月",
            align: 'center',
            children: [
              {
                title: "同期历史领用",
                dataIndex: "seytqlsly",
                key: "seytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "seyxqycsl",
                key: "seyxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "01月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "yytqlsly",
                key: "yytqlsly",
                width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "yyxqycsl",
                key: "yyxqycsl",
                width: 100,
              },
            ],
          },
          {
            title: "02月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "eytqlsly",
                key: "eytqlsly",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "eyxqycsl",
                key: "eyxqycsl",
                 width: 100,
              },
            ],
          },
          {
            title: "03月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "sytqlsly",
                key: "sytqlsly",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "syxqycsl",
                key: "syxqycsl",
                 width: 100,
              },
            ],
          },
          {
            title: "04月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "sytqlsly1",
                key: "sytqlsly1",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "syxqycsl1",
                key: "syxqycsl1",
                 width: 100,
              },
            ],
          },
          {
            title: "05月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "wytqlsly",
                key: "wytqlsly",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "wyxqycsl",
                key: "wyxqycsl",
                 width: 100,
              },
            ],
          },
          {
            title: "06月",
            children: [
              {
                title: "同期历史领用",
                dataIndex: "lytqlsly",
                key: "lytqlsly",
                 width: 100,
              },
              {
                title: "需求预测",
                dataIndex: "lyxqycsl",
                key: "lyxqycsl",
                 width: 100,
              },
            ],
          },
        ];
        break;
      default:
        break;
    }
    return (
      <div class="ComYearTable">
        <Table
          columns={columns}
          dataSource={dataSource}
          bordered
          rowKey="requestId"
          loading={this.state.loading}
          scroll={this.props.scroll}
          rowSelection={ this.props.choose ? rowSelection : null }
          pagination={ this.pagination() }
          style={{ marginTop: "20px" }}
        />
      </div>
    );
  }
}
ecodeSDK.exp(ComYearTable);
