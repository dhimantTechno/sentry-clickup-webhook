const CLICKUP_TOKEN = process.env.CLICKUP_TOKEN;
const CLICKUP_LIST  = '901615367273';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = req.body;
    const issue = body.data?.issue;
    if (!issue) return res.status(200).json({ ok: true, msg: 'skipped' });
    if (body.action && body.action !== 'created') return res.status(200).json({ ok: true });
    const membersRes = await fetch(`https://api.clickup.com/api/v2/list/${CLICKUP_LIST}/member`, { headers: { 'Authorization': CLICKUP_TOKEN } });
    const membersData = await membersRes.json();
    const sumit = (membersData.members || []).find(m => (m.username||'').toLowerCase().includes('sumit') || (m.email||'').toLowerCase().includes('sumit'));
    const taskRes = await fetch(`https://api.clickup.com/api/v2/list/${CLICKUP_LIST}/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': CLICKUP_TOKEN },
      body: JSON.stringify({
        name: `[Sentry] ${(issue.title||issue.culprit||'Exception').substring(0,90)}`,
        description: `## 🔴 Sentry Exception\n\n**ID:** ${issue.id}\n**Endpoint:** ${issue.culprit||'N/A'}\n**Events:** ${issue.count||0}\n**Level:** ${issue.level||'error'}\n\n🔗 [View in Sentry](${issue.web_url||'#'})\n\n---\n*Auto-created by Sentry Webhook*`,
        assignees: sumit ? [sumit.id] : [],
        priority: issue.level === 'error' ? 2 : 3,
        tags: ['sentry','exception']
      })
    });
    const task = await taskRes.json();
    if (task.err) throw new Error(task.err);
    return res.status(200).json({ ok: true, taskId: task.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
