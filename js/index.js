'use strict'

let contractAddress = $('#contractAddress');
let deployedContractAddressInput = $('#deployedContractAddressInput');
let loadDeployedContractButton = $('#loadDeployedContractButton');
let deployNewContractButton = $('#deployNewContractButton');

let killContractButton = $('#killContractButton')

let whoami = $('#whoami');
let whoamiButton = $('#whoamiButton');
let copyButton = $('#copyButton');

let update = $('#update');

let logger = $('#logger');

let deposit = $('#deposit');
let depositButton = $('#depositButton');

let withdraw = $('#withdraw');
let withdrawButton = $('#withdrawButton');

let transferEtherTo = $('#transferEtherTo');
let transferEtherValue = $('#transferEtherValue');
let transferEtherButton = $('#transferEtherButton');

// 宣告定存相關變數 與index.html連接
let bankDingChun = $('#bankDingChun');
let bankDingChunPeriod = $('#bankDingChunPeriod');
let bankDingChunInterest = $('#bankDingChunInterest');

let dingChunEtherValue = $('#dingChunEtherValue');
let dingChunPeriod = $('#dingChunPeriod');
let dingChunButton = $('#dingChunButton');

let dingchunFinalButton = $('#dingchunFinalButton');

let dingChunCancelPeriod = $('#dingChunCancelPeriod');
let dingChunCancelButton = $('#dingChunCancelButton');


let bankAddress = "";
let nowAccount = "";

let web3 = new Web3('http://localhost:8545');

let bank = new web3.eth.Contract(bankAbi);

function log(...inputs) {
	for (let input of inputs) {
		if (typeof input === 'object') {
			input = JSON.stringify(input, null, 2)
		}
		logger.html(input + '\n' + logger.html())
	}
}

init()

async function init() {
	let accounts = await web3.eth.getAccounts()

	for (let account of accounts) {
		whoami.append(`<option value="${account}">${account}</option>`)
	}
	nowAccount = whoami.val();

	update.trigger('click')

	log(accounts, '以太帳戶')
}

// 當按下載入既有合約位址時
loadDeployedContractButton.on('click', function () {
	loadBank(deployedContractAddressInput.val())
})

// 當按下部署合約時
deployNewContractButton.on('click', function () {
	newBank()
})

// 當按下登入按鍵時
whoamiButton.on('click', function () {

	nowAccount = whoami.val();

	update.trigger('click')

})

// 當按下複製按鍵時
copyButton.on('click', function () {
	let textarea = $('<textarea />')
	textarea.val(whoami.val()).css({
		width: '0px',
		height: '0px',
		border: 'none',
		visibility: 'none'
	}).prependTo('body')

	textarea.focus().select()

	try {
		if (document.execCommand('copy')) {
			textarea.remove()
			return true
		}
	} catch (e) {
		console.log(e)
	}
	textarea.remove()
	return false
})

// 當按下更新按鍵時
update.on('click', async function () {
	if (bankAddress != "") {
		let ethBalance = await web3.eth.getBalance(nowAccount)
		let bankBalance = await bank.methods.getBankBalance().call({ from: nowAccount })

		let bankDingChunAmount = await bank.methods.getBankDingChunAmount().call({ from: nowAccount })
		let bankDingChunPeriod = await bank.methods.getBankPeriod().call({ from: nowAccount })
		let bankDingChunInterest = await bank.methods.getBankInterest().call({ from: nowAccount })

		log({
			address: bankAddress,
			ethBalance: ethBalance,
			bankBalance: bankBalance,
			bankDingChunAmount: bankDingChunAmount,
			bankDingChunPeriod: bankDingChunPeriod,
			bankDingChunInterest: bankDingChunInterest
		})
		log('更新帳戶資料')

		$('#ethBalance').text('以太帳戶餘額 (wei): ' + ethBalance)
		$('#bankBalance').text('銀行ETH餘額 (wei): ' + bankBalance)
		$('#bankDingChun').text('銀行定存 (wei): ' + bankDingChunAmount)
		$('#bankDingChunPeriod').text('銀行定存期數: ' + bankDingChunPeriod)
		$('#bankDingChunInterest').text('銀行定存利息: ' + bankDingChunInterest)
	}
	else {
		let ethBalance = await web3.eth.getBalance(nowAccount)

		$('#ethBalance').text('以太帳戶餘額 (wei): ' + ethBalance)
		$('#bankBalance').text('銀行ETH餘額 (wei): ')
		$('#bankDingChun').text('銀行定存 (wei): ')
		$('#bankDingChunPeriod').text('銀行定存期數: ')
		$('#bankDingChunInterest').text('銀行定存利息: ')
	}
})

// 當按下刪除合約按鈕時
killContractButton.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面 
	waitTransactionStatus();
	// 刪除合約
	bank.methods.kill().send({
		from: nowAccount,
		gas: 3400000
	})
		.on('receipt', function (receipt) {
			log(bankAddress, '成功刪除合約');

			bankAddress = "";
			contractAddress.text('合約位址:' + bankAddress)
			deployedContractAddressInput.val(bankAddress)

			// 觸發更新帳戶資料
			update.trigger('click');

			// 更新介面 
			doneTransactionStatus();
		})
		.on('error', function (error) {
			log(error.toString())
			// 更新介面 
			doneTransactionStatus();
		})
})

// 當按下存款按鍵時
depositButton.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面 
	waitTransactionStatus();
	// 存款
	bank.methods.deposit().send({
		from: nowAccount,
		gas: 3400000,
		value: web3.utils.toWei(deposit.val(), 'ether')
	})
		.on('receipt', function (receipt) {
			log(receipt.events.DepositEvent.returnValues, '存款成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面 
			doneTransactionStatus()
		})
		.on('error', function (error) {
			log(error.toString())
			// 更新介面 
			doneTransactionStatus()
		})
})

// 當按下提款按鍵時
withdrawButton.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()
	// 提款
	bank.methods.withdraw(parseInt(withdraw.val(), 10)).send({
		from: nowAccount,
		gas: 3400000
	})
		.on('receipt', function (receipt) {
			log(receipt.events.WithdrawEvent.returnValues, '提款成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面 
			doneTransactionStatus()
		})
		.on('error', function (error) {
			log(error.toString())
			// 更新介面 
			doneTransactionStatus()
		})
})

// 當按下轉帳按鍵時
transferEtherButton.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()
	// 轉帳
	bank.methods.transfer(transferEtherTo.val(), parseInt(transferEtherValue.val(), 10)).send({
		from: nowAccount,
		gas: 3400000
	})
		.on('receipt', function (receipt) {
			log(receipt.events.TransferEvent.returnValues, '轉帳成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面 
			doneTransactionStatus()
		})
		.on('error', function (error) {
			log(error.toString())
			// 更新介面 
			doneTransactionStatus()
		})
})

// 當按下購買定存按鍵時
dingChunButton.on('click', async function () {
	console.log('123');
	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()
	// 轉帳
	bank.methods.dingChun(parseInt(dingChunEtherValue.val(), 10), parseInt(dingChunPeriod.val(), 10)).send({
		from: nowAccount,
		gas: 3400000
	})
		.on('receipt', function (receipt) {
			log(receipt.events.DingChunEvent.returnValues, '定存成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面 
			doneTransactionStatus()
		})
		.on('error', function (error) {
			log(error.toString())
			// 更新介面 
			doneTransactionStatus()
		})
})

// 當按下定存期滿按鍵時
dingchunFinalButton.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()
	// 轉帳
	bank.methods.dingChunFinal().send({
		from: nowAccount,
		gas: 3400000
	})
		.on('receipt', function (receipt) {
			log(receipt.events.DingChunFinalEvent.returnValues, '定存期滿，領回成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面 
			doneTransactionStatus()
		})
		.on('error', function (error) {
			log(error.toString())
			// 更新介面 
			doneTransactionStatus()
		})
})

// 當按下解除定存按鍵時
dingChunCancelButton.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()
	// 轉帳
	bank.methods.dingChunCancel(parseInt(dingChunCancelPeriod.val(), 10)).send({
		from: nowAccount,
		gas: 3400000
	})
		.on('receipt', function (receipt) {
			log(receipt.events.DingChunCancelEvent.returnValues, '解除定存成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面 
			doneTransactionStatus()
		})
		.on('error', function (error) {
			log(error.toString())
			// 更新介面 
			doneTransactionStatus()
		})
})

// 載入bank合約
function loadBank(address) {
	if (!(address === undefined || address === null || address === '')) {

		let bank_temp = new web3.eth.Contract(bankAbi);
		bank_temp.options.address = address;

		if (bank_temp != undefined) {
			bankAddress = address;
			bank.options.address = bankAddress;

			contractAddress.text('合約位址:' + address)
			log(bank, '載入合約')

			update.trigger('click')
		}
		else {
			log(address, '載入失敗')
		}
	}
}

// 新增bank合約
async function newBank() {

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()

	bank.deploy({
		data: bankBytecode
	})
		.send({
			from: nowAccount,
			gas: 3400000
		})
		.on('receipt', function (receipt) {
			log(receipt, '部署合約')

			// 更新合約介面
			bankAddress = receipt.contractAddress
			bank.options.address = bankAddress;
			contractAddress.text('合約位址:' + receipt.contractAddress)
			deployedContractAddressInput.val(receipt.contractAddress)

			update.trigger('click');

			// 更新介面
			doneTransactionStatus();
		})
}

function waitTransactionStatus() {
	$('#accountStatus').html('帳戶狀態 <b style="color: blue">(等待交易驗證中...)</b>')
}

function doneTransactionStatus() {
	$('#accountStatus').text('帳戶狀態')
}

async function unlockAccount() {
	let password = prompt("請輸入你的密碼", "");
	if (password == null) {
		return false;
	}
	else {
		return web3.eth.personal.unlockAccount(nowAccount, password, 60)
			.then(function (result) {
				return true;
			})
			.catch(function (err) {
				alert("密碼錯誤")
				return false;
			});
	}
}