let diskdb = require('diskdb')
let jwt = require('jsonwebtoken')
export default class Client {

  constructor(master) {
    this.master = master
    this.diskdb = diskdb.connect('/.CANDY/db', ['list']) 
  }

  get logged() {
    return (window.localStorage.getItem('cid') ? true : false)
  }

  addToList(ips) {
    let lines = Object.assign({}, ips.split(/\n/))
    let list = []
    for(const line in lines) {
      let tmp = {
        ip: lines[line].split(':')[0],
        port: lines[line].split(':')[1], 
        user: lines[line].split(':')[2],
        pass: lines[line].split(':')[3], 
        status: 'unconfirmed',
        type: ''
      }
      if(lines[line].split(':')[1] == 22) {
        tmp.type = 'ssh'
      } else if(lines[line].split(':')[1] == 23) {
        tmp.type = 'telnet'
      } else {
        tmp.type = 'invalid'
      }
      list.push(tmp)
    }
    this.diskdb.list.save(list)
    return true
  }

  getList(type) {
    if(type == 'ssh' || type == 'telnet') {
      return this.diskdb.list.find({type})
    } else {
      return this.diskdb.list.find()
    }
  }

  get list() {
    return this.diskdb.list
  }

  isFloat(n) {
    return n === +n && n !== (n|0);
  }

  getTotalPageCount(type) {
    let fList = this.getList(type),
        itemsPerPage = 5
    return this.isFloat(fList.length / itemsPerPage) ? ((fList.length / itemsPerPage) ^ 0) + 1 : fList.length / itemsPerPage
  }

  getListToPage(currentPage, type) {
    let fList = this.getList(type), 
        itemsPerPage = 5

    /**
     * Starting position
     * @Calc (Current Page - 1) * Items Per Page
     * @Final 1 - 1 = 0    0 * 5 = 0 
     * @Final 10 - 1 = 9   9 * 5 = 45
     * 
     * Ending position
     * @Calc (Current Page - 1) * (Items Per Page + Items Per Page)
     * @Final 1 - 1 = 0    0 * 5 = 0    0 + 5 = 5
     * @Final 10 - 1 = 9   9 * 5 = 45   45 + 5 = 50
     * 
     */


    const startPos = (currentPage - 1) * itemsPerPage
    const endingPos = (currentPage - 1) * (itemsPerPage) + itemsPerPage
    let elements = []
    for(let i=startPos; i<endingPos;i++) {
      if(fList[i] !== undefined) {
        elements.push(fList[i])
      }
    }

    return elements
    
  }

  checkList(type) {
    let fList = this.list.find({ type, status: 'unconfirmed'}), 
        listToken = jwt.sign({data: JSON.stringify(fList)}, 'db//==Ap46oxzxZQ+6')
    this.master.emit('kinai:load:unconfirmed', listToken)
  }

  get uCount() {
    return this.list.count({status: 'unconfirmed'}).toString()
  }

}