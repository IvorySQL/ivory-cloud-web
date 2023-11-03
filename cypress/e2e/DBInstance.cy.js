describe('DBInstance spec', () => {
  it('', () => {
    // cy.exec('npm run dev')

    // cy.clearAllLocalStorage()
    localStorage.setItem('XAUTHTOKEN', 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsImNyZWF0ZWQiOjE2OTc1MzI2NzEyMDAsInJvbGVzIjpbInhpbmZ1IiwiYWRtaW4iXSwiaWQiOjIsImV4cCI6MTY5NzYxOTA3MX0.1AJN4Z_roQq3H6IxZTrCCV35IixAe5OvGR18Vh9tkZxh5EooeQa5NJR9Jw8580B3viMySfEXK3ol9fAskuNpRg')
    localStorage.setItem('userId', '3')
    localStorage.setItem('userName', 'demo')
    localStorage.setItem('roles', '["routine"]')

    // 返回集群信息
    cy.intercept('GET', '**/clusters', {
      statusCode: 200,
      body: [
        { "clusterId": "ef9d1dcfe80f440b9fa67a7ef2fcd30b", "clusterName": "k8s" }
      ]
    }).as('getCluster')

    // 返回命名空间
    cy.intercept('GET', '**/clusters/*/namespace', {
      statusCode: 200,
      body: [
        { "metadata": { "name": "highgo" } }
      ]
    }).as('getNameSpace')

    // 返回存储类型
    cy.intercept('GET', '**/storage-class?clusterId=ef9d1dcfe80f440b9fa67a7ef2fcd30b', {
      statusCode: 200,
      body: [
        {"metadata": {"uid": "1", "name": "highgo"}}
      ]
    })

    cy.visit('http://localhost:9528/#/nativeCloud/DBInstance/index')
    cy.url().should('contain', 'DBInstance')

    // 下一步
    cy.wait('@getNameSpace').then(() => {
      // 输入实例名称
      cy.get('.inputName').type('highgo')
      // 必须点开小眼睛之后才能用.type输入密码
      cy.get('#show-pwd1').click()
      cy.get('#show-pwd2').click()
      cy.get('#inputPwd').type('Hello@123')
      cy.get('#confirmPdw').type('Hello@123')
      cy.get('.onSubmit').click()
    })

    // 判断确认订单页面数据是否正确
    cy.url().should('contain', 'ConfirmOrder')
    cy.get('.el-form-item').contains('集群').next().should('contain.text', 'k8s')
    cy.get('.el-form-item').contains('命名空间').next().should('contain.text', 'highgo')
    cy.get('.el-form-item').contains('实例类型').next().should('contain.text', '单节点')
    cy.get('.el-form-item').contains('实例名称').next().should('contain.text', 'highgo')
    cy.get('.el-form-item').contains('性能规格').next().should('contain.text', '1 vCPUs | 1 GB')
    cy.get('.el-form-item').contains('存储类型').next().should('contain.text', 'highgo')
    cy.get('.el-form-item').contains('存储空间').next().should('contain.text', '5 GB')

    // 确认订单
    cy.intercept('POST', '**/instances', {
      statusCode: 200,
      body:
        {"status": "CREATING"}
    }).as('creating')
    cy.get('.onSubmit').click()
    cy.wait('@creating').then(() => {
      // 跳转到数据库管理页面
      cy.url().should('contain', 'DBManage')
    })
  })
})
