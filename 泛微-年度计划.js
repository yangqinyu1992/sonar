const { Table, Input, InputNumber, Button, message, Modal, Form, Radio, Upload, Icon, Tooltip } = antd;
const { WeaTop, WeaUpload, WeaTextarea } = ecCom
ecodeSDK.imp(ComYearTable);
let monthDate = new Date()
class Approval extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			materiel1: false,
			wlbmvalue: "",
			wlmcvalue: '',
			selected: [],
			bomData: [],
			dtData: [],
			bomTotal: 0,
			dtTotal: 0,
			pageNodt: 1,
			pageSizeDt: 5,
			pageNoBom: 1,
			pageSizeBom: 5,
			bcValue: '',// 是否第一次保存
			tjValue: '',// 是否第一次提交
			requestId: '',
			fileList: [], // 文件列表
		};
	}

	componentDidMount() {
		let valueBc = WfForm.getFieldValue(WfForm.convertFieldNameToId("sfdycbc"))
		let valueTj = WfForm.getFieldValue(WfForm.convertFieldNameToId("sfdyctj"))
		let id = WfForm.getBaseInfo().requestid
		this.setState({
			bcValue: valueBc,
			tjValue: valueTj,
			requestId: id
		}, () => {
			this.getTableData('dt')
		})
		this.getFun()
	}

	// 模板下载
	downExcel = () => {
		const { bcValue } = this.state
		const { exportExcelApi } = this.props
		let type = WfForm.getFieldValue(WfForm.convertFieldNameToId("materialclassify"))
		if (bcValue == 0) {
			message.error('请先进行流程保存再进行物料填报')
		} else {
			const a = document.createElement('a');
			a.href = `${exportExcelApi}?requestId=${WfForm.getBaseInfo().requestid}&materialClassify=${type}`
			a.click();
		}
	}

	// 选择物料提报
	selectMaterial = () => {
		const { bcValue } = this.state
		if (bcValue == 0) {
			return message.error('请先进行流程保存再进行物料填报')
		}
		let value = WfForm.getFieldValue(WfForm.convertFieldNameToId("materialclassify"))
		if (value == '') {
			return message.error('请先选择物料预测类型')
		}

		this.setState({ materiel1: true, pageNoBom: 1, wlbmvalue: '', wlmcvalue: '', selected: [] }, () => {
			this.getTableData('boom')
		});
	}

	getCustom = () => {
		const { tjValue, bcValue } = this.state
		if (tjValue == '0') {
			return (
				<div>
					<Button type="primary" onClick={this.selectMaterial} style={{ marginRight: '10px' }
					}> <span style={{ color: 'white', float: 'left' }}> 选择物料提报 </span></Button >
					<Button type="primary" onClick={this.downExcel} style={{ marginRight: '10px' }
					}> <span style={{ color: 'white', float: 'left' }}> 模板下载 </span></Button >
					{(bcValue != 0) ?
						<Upload {...upProps} >
							<Button type="ghost" >
								<Icon type="upload" /> 模板导入
							</Button>
						</Upload>
						: ''}
				</div>
			)
		}
	};
	// 展示上传文件列表
	getFile = () => {
		const { fileList } = this.state
		let file = fileList.slice(-1);
		return (<div style={{ display: "flex", width: '300px', height: '30px', alignItems: 'center', justifyContent: "flex-start" }}>
			<i className="icon-coms-currency-Enclosure" />
			<span style={{ display: 'block', margin: '0 10px 0 10px' }}>{file[0].name}</span>
			<i className="icon-coms-Clear" style={{marginTop:'3px'}} onClick={() => {
				this.setState({ fileList: [] }, () => {
					message.success('删除成功')
				})
			}} />
		</div>)
	}


	// @function 确定弹框
	handleOk = () => {
		var that = this
		if (!that.state.selected.length) {
			this.setState({
				materiel1: false
			});
			return
		}
		let type = WfForm.getFieldValue(WfForm.convertFieldNameToId("materialclassify"))
		let parms = {
			materialClassify: type,
			wlbmList: that.state.selected,
			requestId: WfForm.getBaseInfo().requestid
		}
		let { saveDtApi } = this.props
		$.ajax({
			type: "POST",
			url: saveDtApi,
			contentType: "application/json; charset=utf-8",
			data: JSON.stringify(parms),
			success: (res) => {
				if (res.code == "200") {
					message.success('提交成功');
					this.materieldown()
				} else {
					message.error(res.msg);
				}
			},
		});
	};
	// 关闭按钮
	handleCancel = () => {
		this.setState({ selected: [] })
		this.setState({
			materiel1: false
		});
	};

	// 搜索
	searchItem = () => {
		let wlbm = this.state.wlbmvalue//物料编码
		let wlmc = this.state.wlmcvalue//物料名称
		this.getTableData('boom', wlbm, wlmc)
	}
	selectedRowsList = (val) => {
		this.setState({ selected: val })
	};


	wlbmSlice = (event) => {//搜索物料编码
		const newValue = event.target.value
		this.setState({ wlbmvalue: newValue })
	}

	wlmcSlice = (event) => {//搜索物料编码
		const newValue = event.target.value
		this.setState({ wlmcvalue: newValue })
	}

	materieldown = () => {
		this.getTableData('dt')
		this.setState({
			materiel1: false
		});
	}

	getBomData = (params) => {
		let { getBomApi } = this.props
		callApi(getBomApi, 'GET', params).then(res => {
			if (res.code == '200') {
				this.setState({ bomData: res.data || [], bomTotal: res.totalSize || 0, loading: false });
			}
		});
	}

	getDtData = (params) => {
		let { getDtApi } = this.props
		callApi(getDtApi, 'GET', params).then(res => {
			if (res.code == '200') {
				this.setState({ dtData: res.data || [], dtTotal: res.totalSize || 0, loading: false });
			}
		});
	}

	getTableData = (typeInfo, wlbm, wlmc) => {
		const { pageNodt, pageSizeDt, pageNoBom, pageSizeBom } = this.state
		let type = WfForm.getFieldValue(WfForm.convertFieldNameToId("materialclassify"))
		let params1 = {
			materialClassify: type,
			requestId: WfForm.getBaseInfo().requestid,
		}
		if (typeInfo == 'dt') {
			params1.pageNo = pageNodt
			params1.pageSize = pageSizeDt
			this.getDtData(params1)
		} else {
			params1.wlbm = wlbm
			params1.wlmc = wlmc
			params1.pageNo = pageNoBom
			params1.pageSize = pageSizeBom
			this.getBomData(params1)
		}
	};

	//分页
	updatePage = (current, size, data, type) => {
		if (type == 'bom') {
			this.setState({ pageNoBom: current, pageSizeBom: size, bomData: data }, () => {
				this.getTableData(type)
			})
		} else {
			this.setState({ pageNodt: current, pageSizeDt: size, dtData: data }, () => {
				this.getTableData(type)
			})
		}
	}

	editData = (fieldValue, id, fieldName) => {

		let { updateDtApi } = this.props
		let type = WfForm.getFieldValue(WfForm.convertFieldNameToId("materialclassify"))

		params = {
			fieldValue,
			id,
			fieldName,
			materialClassify: type,
		}
		$.ajax({
			type: "POST",
			url: updateDtApi,
			contentType: "application/json; charset=utf-8",
			data: JSON.stringify(params),
			success: (res) => {
				if (res.code == "200") {
					message.success("修改成功")
					this.getTableData('dt');
				} else {
					message.error(res.msg);
				}
			},
		});
	};

	// 校验明细是否存在
	checkFlowDtExist = () => {
		var flag = false;
		$.ajaxSettings.async = false
		$.get("/api/ec/annualPlan/checkFlowDtExist?requestId=" + WfForm.getBaseInfo().requestid, (res) => {
			if (res.code == 200) {
				flag = true
			}
		})
		$.ajaxSettings.async = true;
		return flag;
	}

	getFun = () => {
		let that = this
		const { requestId } = that.state
		var fieldid = WfForm.convertFieldNameToId("materialclassify");// 获取字段id
		let valueType = WfForm.getFieldValue(WfForm.convertFieldNameToId("materialclassify"))

		WfForm.bindFieldChangeEvent(fieldid, function (obj, id, value) {
			// 产后加工
			if (value == 3) {
				window.setTimeout(function () {
					WfForm.changeFieldValue(fieldid, {
						value: "",
						specialobj: [
							{ id: "", name: "" }
						]
					});
				}, 10);
				return message.warning('请回门户页面发起产后加工提报流程。')
			}

			let isExist = that.checkFlowDtExist(requestId)
			if (isExist) {
				WfForm.showConfirm("是否确定更改物料预测类型，如需更改，原导入数据会被清空，需重新导入物料预测数据", function () {
					that.updateFlowDtRequestId(value, 2)
				}, function () {
					location.reload();
				}, {
					title: "提示",      //弹确认框的title，仅PC端有效
					okText: "确认",         //自定义确认按钮名称
					cancelText: "取消"    //自定义取消按钮名称
				});

			}else{// 没有明细就直接改类型
				if(value && value!=valueType){
					that.updateFlowDtRequestId(value, 1)
        	// location.reload();
			}
			}
		});
	}

	// 修改物料预测类型
	updateFlowDtRequestId = (type, isDelete) => {
		if( WfForm.getBaseInfo().requestid =='-1' ) return
		var that = this
		let parms = {
			materialClassify: type,
			requestId: WfForm.getBaseInfo().requestid
		}

		$.ajax({
			type: "POST",
			url: '/api/ec/annualPlan/updateFlowDtRequestId',
			contentType: "application/json; charset=utf-8",
			data: JSON.stringify(parms),
			success: (res) => {
				if (res.code == "200") {
					if(isDelete == 2){// 有明细
						that.deleteFlowDtInfo(type)
            
					}else{
						location.reload();
					}
				} else {
					message.error(res.msg);
					location.reload();
				}
			},
		});
	};



	// 删除明细
	deleteFlowDtInfo = (newValue) => {
		let that = this
		$.ajax({
			url: "/api/ec/annualPlan/deleteFlowDtInfo",
			type: "GET",
			async: false,// 关键点：将异步设置为同步
			data: { requestId: WfForm.getBaseInfo().requestid, materialClassify: newValue },
			success: function (res) {
				if (res.code == 200) {
					WfForm.showMessage("删除明细成功");
          location.reload();
					that.getTableData('dt')
				}
			},
		})
	}

	render() {
		let that = this
		const {
			materiel1,
			tjValue,
			fileList,
			bomTotal,
			dtTotal,
		} = this.state;
		// table 列表
		columns = [
			{
				title: "物料信息",
				align: "center",
				// fixed: "left",
				children: [
					{
						title: "物料编码",
						dataIndex: "wlbm",
						key: "wlbm",
						width: 140,
						render(text, recad, index) {
							return <div style={{ height: '38px', lineHeight: '38px' }} > {text} </div>;
						},
					},
					{
						title: "物料名称",
						dataIndex: "wlmc",
						key: "wlmc",
						width: 130,
						render(text, reacd, index) {
							return <Tooltip placement="top" title={text} >
								<div className="sgnc" > {text} </div>
							</Tooltip>;
						},
					},
					{
						title: "规格型号",
						dataIndex: "gg",
						key: "gg",
						width: 150,
						render(text, reacd, index) {
							return <Tooltip placement="top" title={text} >
								<div className="sgnc" > {text} </div>
							</Tooltip>;
						},
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
						width: 50,
					},
					{
						title: "单价(元)",
						dataIndex: "jzj",
						key: "jzj",
						width: 100,
					},
					{
						title: "图片",
						dataIndex: "wltp",
						key: "wltp",
						width: 100,
						render(text, record, index) {
							if (!text || text.trim() === "") {
								return null;
							}
							return <img style={{ width: '60px', height: "35px", }} src={text} alt="物料图片" />;
						},
					},
					{
						title: "当前库存",
						dataIndex: "dqkc",
						key: "dqkc",
						width: 100,
					},
					{
						title: "采购未清",
						dataIndex: "wqsl",
						key: "wqsl",
						width: 100,
					},
				],
			},
			{
				title: "",
				// width: 200,
				children: [
					// {
					// 	title: "亩均用量",
					// 	dataIndex: "mjyl",
					// 	key: "mjyl",
					// 	render(text, recad, index) {
					// 		return <div style={{ height: '38px', lineHeight: '38px' }} > {text} </div>;
					// 	},
					// },
					{
						title: "用途、作用",
						dataIndex: "ytzy",
						key: "ytzy",
            width: 100,
					},
					{
						title: "预计使用月份",
						dataIndex: "yjsyyf",
						key: "yjsyyf",
            width: 100,
					},
					{
						title: "上一年整年用量",
						dataIndex: "ndtqlsly",
						key: "ndtqlsly",
            width: 100,
					},
				],
			},
			{
				title: "年度合计",
				// width: 120,
				children: [
					{
						title: "同期历史领用",
						dataIndex: "ndtqlsly",
						key: "ndtqlsly",
            width: 100,
						render(text, recad, index) {
							return <div style={{ height: '38px', lineHeight: '38px' }} > {text} </div>;
						},
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
						render(text, recad, index) {
							return (
								tjValue == 0 ?
									<InputNumber
										style={{ width: '60px' }
										}
										defaultValue={text}
										min={0}
										precision={2}
										onBlur={(v) => {
											that.editData(v.target.value, recad.id, 'qyxqycsl')
										}}
									/> : text
							);
						},
					},
				],
			},
			{
				title: "8月",
				// width: 120,
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
						render(text, recad, index) {
							return (
								tjValue == 0 ?
									<InputNumber
										style={{ width: '60px' }
										}
										defaultValue={text}
										min={0}
										precision={2}
										onBlur={(v) => {
											that.editData(v.target.value, recad.id, 'byxqycsl')
										}}
									/> : text
							);
						},
					},
				],
			},
			{
				title: "9月",
				// width: 120,
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
						render(text, recad, index) {
							return (
								tjValue == 0 ?
									<InputNumber
										style={{ width: '60px' }
										}
										defaultValue={text}
										min={0}
										precision={2}
										onBlur={(v) => {
											that.editData(v.target.value, recad.id, 'jyxqycsl')
										}}
									/> : text
							);
						},
					},
				],
			},
			{
				title: "10月",
				// width: 120,
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
						render(text, recad, index) {
							return (
								tjValue == 0 ?
									<InputNumber
										style={{ width: '60px' }
										}
										defaultValue={text}
										min={0}
										precision={2}
										onBlur={(v) => {
											that.editData(v.target.value, recad.id, 'syxqycsl2')
										}}
									/> : text
							);
						},
					},
				],
			},
			{
				title: "11月",
				// width: 120,
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
						render(text, recad, index) {
							return (
								tjValue == 0 ?
									<InputNumber
										style={{ width: '60px' }
										}
										defaultValue={text}
										min={0}
										precision={2}
										onBlur={(v) => {
											that.editData(v.target.value, recad.id, 'syyxqycsl')
										}}
									/> : text
							);
						},
					},
				],
			},
			{
				title: "12月",
				// width: 120,
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
						render(text, recad, index) {
							return (
								tjValue == 0 ?
									<InputNumber
										style={{ width: '60px' }
										}
										defaultValue={text}
										min={0}
										precision={2}
										onBlur={(v) => {
											that.editData(v.target.value, recad.id, 'seyxqycsl')
										}}
									/> : text
							);
						},
					},
				],
			},
			{
				title: "01月",
				// width: 120,
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
						render(text, recad, index) {
							return (
								tjValue == 0 ?
									<InputNumber
										style={{ width: '60px' }
										}
										defaultValue={text}
										min={0}
										precision={2}
										onBlur={(v) => {
											that.editData(v.target.value, recad.id, 'yyxqycsl')
										}}
									/> : text
							);
						},
					},
				],
			},
			{
				title: "02月",
				// width: 120,
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
						render(text, recad, index) {
							return (
								tjValue == 0 ?
									<InputNumber
										style={{ width: '60px' }
										}
										defaultValue={text}
										min={0}
										precision={2}
										onBlur={(v) => {
											that.editData(v.target.value, recad.id, 'eyxqycsl')
										}}
									/> : text
							);
						},
					},
				],
			},
			{
				title: "03月",
				// width: 120,
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
						render(text, recad, index) {
							return (
								tjValue == 0 ?
									<InputNumber
										style={{ width: '60px' }
										}
										defaultValue={text}
										min={0}
										precision={2}
										onBlur={(v) => {
											that.editData(v.target.value, recad.id, 'syxqycsl')
										}}
									/> : text
							);
						},
					},
				],
			},
			{
				title: "04月",
				// width: 120,
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
						render(text, recad, index) {
							return (
								tjValue == 0 ?
									<InputNumber
										style={{ width: '60px' }
										}
										defaultValue={text}
										min={0}
										precision={2}
										onBlur={(v) => {
											that.editData(v.target.value, recad.id, 'syxqycsl1')
										}}
									/> : text
							);
						},
					},
				],
			},
			{
				title: "05月",
				// width: 120,
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
						render(text, recad, index) {
							return (
								tjValue == 0 ?
									<InputNumber
										style={{ width: '60px' }
										}
										defaultValue={text}
										min={0}
										precision={2}
										onBlur={(v) => {
											that.editData(v.target.value, recad.id, 'wyxqycsl')
										}}
									/> : text
							);
						},
					},
				],
			},
			{
				title: "06月",
				// width: 120,
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
						render(text, recad, index) {
							return (
								tjValue == 0 ?
									<InputNumber
										style={{ width: '60px' }
										}
										defaultValue={text}
										min={0}
										precision={2}
										onBlur={(v) => {
											that.editData(v.target.value, recad.id, 'lyxqycsl')
										}}
									/> : text
							);
						},
					},
				],
			},
			{
				title: "备注",
				dataIndex: "bz",
				key: "bz",
				render(text, recad, index) {
					return (
						tjValue == 0 ?
							<WeaTextarea className="bzText"
								style={{ width: 70 }
								}
								value={text}
								onChange={(v) => {

									recad.bz = v
								}
								}
								onBlur={(v) => {

									recad.bz = v
									that.editData(v, recad.id, 'bz')
								}}
							/> : text
					)
				}

			},
		];

		// 上传模板
		upProps = {
			name: 'file',
			action: `${that.props.inputExcelApi}?requestId=${WfForm.getBaseInfo().requestid}&materialClassify=${WfForm.getFieldValue(WfForm.convertFieldNameToId("materialclassify"))}`,
			headers: {
				authorization: 'authorization-text',
			},
			showUploadList: false,
			onChange(info) {
				if (info.file && info.file.status == 'removed') return message.success('删除成功。');
				if (info.file.response && info.file.response.code == 200) {
					that.setState({ fileList: info.fileList })
					message.success('上传成功。');
					that.getTableData('dt')
				} else if (info.file.response && info.file.response.code == 400) {
					message.error(info.file.response.msg || '上传失败');
				} else if (info.file.response && info.file.response.code == 202) {

					let html = ""
					info.file.response.data ? info.file.response.data.map((item) => {
						html += `<p>${item}</p>`
					}) : ''
					Modal.warning({
						title: '有错误信息',
						width: '800px',
						content: <div dangerouslySetInnerHTML={{ __html: `${html}` }} />,
					});
				}
			},
		

		};


		return (
			<div class="yearApproval" >
				<div>
					{this.getCustom()}
					{fileList.length ? this.getFile() : <></>}
					<ComYearTable
						columns={columns}
						onChange={that.updatePage}
						dataSource={this.state.dtData}
						total={dtTotal}
						scroll={{ x: "calc(2300px + 50%)", y: 400 }}
						choose={false}
					/>
					<Modal
						title='物料选择'
						visible={materiel1}
						onOk={that.handleOk}
						onCancel={that.handleCancel}
						width='1200px'
						wrapClassName="vertical-center-modal"
						style={{ bottom: 60 }}
					>
						<span>物料编码：<Input size="large" type="text" placeholder="请输入物料编码" style={{ width: '150px' }} onChange={that.wlbmSlice} onPressEnter={that.searchItem} /> </span>
						<span > 物料名称：<Input size="large" placeholder="请输入物料名称" style={{ width: '150px' }} onChange={that.wlmcSlice} onPressEnter={that.searchItem} /> </span>
						<Button type="primary" icon="search" style={{ marginLeft: '20px' }} onClick={that.searchItem} > 搜索 </Button>
						<ComYearTable
							total={bomTotal}
							onChange={that.updatePage}
							scroll={{ x: "calc(800px + 50%)", y: 400 }}
							dataSource={this.state.bomData}
							selectedRowsList={that.selectedRowsList}
							choose={true}
						/>
					</Modal>
				</div>
			</div>
		);
	}
}
ecodeSDK.setCom("${appId}", "Approval", Approval);
