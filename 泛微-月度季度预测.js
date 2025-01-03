<script>
  WfForm.changeFieldAttr(WfForm.convertFieldNameToId("nccc"), 5);
  WfForm.changeFieldAttr(WfForm.convertFieldNameToId("ncjsbc"), 5);
  WfForm.changeFieldAttr(WfForm.convertFieldNameToId("jgccc"), 5);
  WfForm.changeFieldAttr(WfForm.convertFieldNameToId("cjbc"), 5);
  WfForm.changeFieldAttr(WfForm.convertFieldNameToId("qjz"), 5);
  WfForm.changeFieldAttr(WfForm.convertFieldNameToId("zzmjm"), 5);
  WfForm.changeFieldAttr(WfForm.convertFieldNameToId("hmbmz"), 5);
  function getShow(value) {
      if (value == '1') {
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("ncjsbc"), 3);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("qjz"), 3);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("zzmjm"), 3);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("hmbmz"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("jgccc"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("cjbc"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("nccc"), 5);
      } else if (value == '2') {
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("hmbmz"), 2);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("zzmjm"), 3);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("jgccc"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("qjz"), 3);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("nccc"), 3);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("ncjsbc"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("cjbc"), 5);
      }
      else if (value == '3') {
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("hmbmz"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("zzmjm"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("jgccc"), 3);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("cjbc"), 3);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("ncjsbc"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("qjz"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("nccc"), 5);
      } else if (value == '4') {
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("hmbmz"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("zzmjm"), 3);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("jgccc"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("cjbc"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("ncjsbc"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("qjz"), 3);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("nccc"), 3);
      } else {
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("zzmjm"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("hmbmz"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("jgccc"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("qjz"), 3);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("nccc"), 3);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("ncjsbc"), 5);
          WfForm.changeFieldAttr(WfForm.convertFieldNameToId("cjbc"), 5);
      }
  }
  // 判断物料预测类型判断字段显示隐藏
  let wlyclxValue = WfForm.getFieldValue(WfForm.convertFieldNameToId("materialclassify"))
  getShow(wlyclxValue)
  WfForm.bindFieldChangeEvent(WfForm.convertFieldNameToId("materialclassify"), function (obj, id, value) {
      window.getShow(value)
  });
  // 校验必填
  function checkField() {
      var type1 = WfForm.getFieldValue(WfForm.convertFieldNameToId("materialclassify")) // 物料预测类型
      if (type1 == '') {
          WfForm.showMessage("请先选择物料预测类型");
          return false;
      }
      if (type1 == '2') {
          var hmbmz = WfForm.getFieldValue(WfForm.convertFieldNameToId("hmbmz"));
          if (hmbmz != '' && Number(hmbmz) <= 0) {
              WfForm.showMessage("换苗、补苗数必须为正整数");
              return false;
          }
      }
      if (type1 == '1' || type1 == '2' || type1 == '4') {
          var zzmjm = WfForm.getFieldValue(WfForm.convertFieldNameToId("zzmjm"))
          if (Number(zzmjm) <= 0) {
              WfForm.showMessage("种植面积必须大于0");
              return false;
          }
      }
      return true;
  }
  WfForm.registerCheckEvent(WfForm.OPER_SAVE, function (callback) {
      // 校验是否在规定时间
      var flag = getEnableUpdateDay().then(res => {
        console.log(res, '===>res保存')
        if(!res) return
        if (checkField()) {
            callback();
            WfForm.changeFieldValue(WfForm.convertFieldNameToId("sfdycbc"), { value: "1" });
        }
      });
      // console.log(flag, '===>flag')
      // if (!flag) return
      // if (checkField()) {
      //     callback();
      //     WfForm.changeFieldValue(WfForm.convertFieldNameToId("sfdycbc"), { value: "1" });
      // }
  });
  // 提交
  WfForm.registerCheckEvent(WfForm.OPER_SUBMIT, function (callback) {
      let isExist = checkFlowDtExist(WfForm.getBaseInfo().requestid)
      console.info(isExist)
      if (!isExist) {
        WfForm.showMessage("请先选择物料信息");
        return false;
      }
      // 校验是否在规定时间
      getEnableUpdateDay().then(res => {
        console.log(res, '===>res提交')
        if(!res) return
        if (checkField() && WfForm.getBaseInfo().requestid != -1 && checkEnablePresenting() ) {
            callback();
            WfForm.changeFieldValue(WfForm.convertFieldNameToId("sfdyctj"), { value: "1" });
        }
      });
      // console.log(flag, '===>flag')
      // if (!flag) return
      // if (checkField() && WfForm.getBaseInfo().requestid != -1 && checkEnablePresenting() ) {
      //     callback();
      //     WfForm.changeFieldValue(WfForm.convertFieldNameToId("sfdyctj"), { value: "1" });
      // }
  });
  jQuery().ready(function () {
      // 获取值
      let yczqVal = WfForm.getFieldValue(WfForm.convertFieldNameToId("yczq"))
      console.info('预测周期的值valueYczq', yczqVal)
      if (yczqVal == '') {
          WfForm.changeFieldValue(WfForm.convertFieldNameToId("yczq"), { value: getNextMonth() });
      }
      var jhy = WfForm.getFieldValue(WfForm.convertFieldNameToId("jhy")); // 计划员
      var tbr = WfForm.getFieldValue(WfForm.convertFieldNameToId("tbr"));//提报人
      if (jhy == tbr) { getPlanner() }
      // 退回
      WfForm.registerCheckEvent(WfForm.OPER_REJECT, function (callback) {
          WfForm.changeFieldValue(WfForm.convertFieldNameToId("sfdycbc"), { value: "1" });
          WfForm.changeFieldValue(WfForm.convertFieldNameToId("sfdyctj"), { value: "0" });
          callback();
          console.info('退回成功')
      });
  });
  function getNextMonth() {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    console.log(month, now, '当前月, 当前时间 ')
    if (month == 11 || month == 3 || month == 8) {
      if (day > 20) {
        now.setMonth(month + 2);
        return now.getMonth() + 1;
      } else {
        return getMonthZw(month + 1)
      }
    } else {
      return getMonthZw(month + 1)
    }
  }
  getEnableUpdateDay();
  // 获取可提报日期
  function getEnableUpdateDay() {
    
      var szbm = WfForm.getFieldValue(WfForm.convertFieldNameToId("sgjd"))
      $.ajaxSettings.async = false
      // /ec/materialForecast/getFillTime ec/annualPlan/getEnableUpdateDay
    console.log('获取可提报日期', '===>')
     return new Promise((resolve, reject) => {
      $.get("/api/ec/materialForecast/getFillTime", (res) => 
        {
          if (res.code != 200) {
            console.log(res, '====>res')
            const { days = [1, 5] } = res.data || { days: [] };
            var str = `<p>
              <span style="color:#606266;">
                  请在${days[0]}-${days[1]}日提报物料预测，其余时间可通过
                </span>
                <span class="openLinkTo" style="text-decoration:underline ;color:#0099FF;cursor: pointer;">"采购申请单"</span>
                <span style="color:#606266;">进行提报。</span>
            </p>`;
            WfForm.showConfirm(str, function(){
              window.close();
            },function(){
              window.close();
            },{
                title:"提示",       //弹确认框的title，仅PC端有效
                okText:"确定",          //自定义确认按钮名称     //自定义取消按钮名称
            });
            var element = document.querySelector('.openLinkTo');
            if (element) {
              element.addEventListener('click', function() {
                window.location.href = res.url;
              });
            }
            resolve(false)
          } else {
            resolve(true)
            // alert("获取可提报日期失败，请联系管理员排查")
          }
     })
          
      })
      $.ajaxSettings.async = true;
    };
      // var curDay=  new Date().getDate()
      // if(!(curDay>=days[0] && curDay <= days[1])){
      //   WfForm.showConfirm(`可提报日期在${days[0]}到${days[1]}之间，当天不在可提报日期内`, function(){
      //     window.close();
      //   },function(){
      //   },{
      //       title:"提示",       //弹确认框的title，仅PC端有效
      //       okText:"确定",          //自定义确认按钮名称     //自定义取消按钮名称
      //   });
        // alert(`可提报日期在${days[0]}到${days[1]}之间，当天不在可提报日期内`)
        // window.close();
      // }
  
  // 获取计划员
  function getPlanner() {
      var szbm = WfForm.getFieldValue(WfForm.convertFieldNameToId("sgjd"))
      $.get("/api/ec/annualPlan/getPlanner?szbm=" + szbm, (res) => {
          if (res.code == 200) {
              var values = res.data.map(obj => obj.id)
              WfForm.changeFieldValue(WfForm.convertFieldNameToId("jhy"), { value: values.join(','), specialobj: res.data });
          }
      })
  }
  // 预测月份/ 季度
  function getMonthZw(month) {
      if (month == 3) {
          return 14
      } else if (month == 6) {
          return 15
      } else if (month == 9) {
          return 16
      } else if (month == 12) {
          return 13
      } else {
          return month + 1
      }
  }
  // 校验明细
  function checkFlowDtExist(id) {
      var flag = false;
      $.ajaxSettings.async = false
      $.get("/api/ec/materialForecast/checkFlowDtExist?requestId=" + id, (res) => {
          if (res.code == 200) {
              flag = true
          }
      })
      $.ajaxSettings.async = true;
      return flag;
  }
  // 校验不能重复提交
  function checkEnablePresenting() {
      let sgjd = WfForm.getFieldValue(WfForm.convertFieldNameToId("sgjd"))
      let fqny = WfForm.getFieldValue(WfForm.convertFieldNameToId("fqny"))
      let materialClassify = WfForm.getFieldValue(WfForm.convertFieldNameToId("materialClassify"))
      var flag = false;
      $.ajaxSettings.async = false
      $.get(`/api/ec/materialForecast/submitCheck?sgjd=${sgjd}&fqny=${fqny}&materialClassify=${materialClassify}`, (res) => {
          console.info('resres', res)
          if (res.code == 200) {
              flag = true
          } else {
              WfForm.showMessage(res.msg || '提交失败');
          }
      }
      )
      $.ajaxSettings.async = true;
      return flag;
  }
  var szbm = WfForm.getFieldValue(WfForm.convertFieldNameToId("szbm"))
  var sfdyctj = WfForm.getFieldValue(WfForm.convertFieldNameToId("sfdyctj"))
  console.info('泛微--sfdyctj', sfdyctj)
  var sfdycbc = WfForm.getFieldValue(WfForm.convertFieldNameToId("sfdycbc"))
  console.info('泛微--sfdycbc', sfdycbc)
  var params = {
      domId: 'Bimonthly',
      id: '941fd9570fac46d186761d0adaecd0ba',
      name: 'Bimonthly', //上面的组件名称
      cb: function (e) { //组件加载完成之后的回调
          console.log('success', e);
      },
      noCss: true,
      props: {
      }
  };
  ecodeSDK.render(params);
  </script>
  

