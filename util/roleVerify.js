/*
 * @Author: Rantele
 * @Date: 2022-11-18 11:52:25
 * @LastEditors: Rantele
 * @LastEditTime: 2022-11-18 12:41:06
 * @Description:角色权限验证
 *
 */

//user.roles
roleValid = (roles, allowRoleArr, separator = ',') => {
  const roleArr = roles.split(separator).map(Number)
  console.log(roleArr)
  //判断是否角色中是否包含该权限
  console.log(allowRoleArr.every((val) => roleArr.includes(val)))
  return allowRoleArr.every((val) => roleArr.includes(val))
}

module.exports = { roleValid }
