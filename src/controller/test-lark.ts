import config from '../config'

export async function testLark () {
  try {
    const content: any[] = [
      [{tag: 'text', un_escaped: true, text: `测试 Lark 消息发送`}],
    ]
      const res = await fetch(`https://open.larksuite.com/open-apis/bot/v2/hook/${config.LarkApiKey}`, {
        method: 'post',
        body: JSON.stringify({
          email: 'xieaolin@gmail.com',
          msg_type: 'post',
          content: {
            post: {
              zh_cn: {
                title: `=== Lark API 测试 ===`,
                content,
              }
            },
          }
        })
      })

      if (res.status >= 400) {
        console.error(`helper: send Lark notify failed, response ${res.status} ${res.statusText}`)
      }
  } catch (e) {
    console.error('helper: send Lark notify failed:', e)
  }
}
