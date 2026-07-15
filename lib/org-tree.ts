export type OrgInput = {
  id: string;
  managerId: string | null;
  firstName: string;
  lastName: string;
  positionTitle?: string | null;
};

export type OrgNode = OrgInput & { children: OrgNode[] };

function byName(a: OrgNode, b: OrgNode): number {
  return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);
}

export function buildTree(employees: OrgInput[]): OrgNode[] {
  const nodes = new Map<string, OrgNode>(
    employees.map((e) => [e.id, { ...e, children: [] }])
  );
  const roots: OrgNode[] = [];

  for (const node of nodes.values()) {
    const manager = node.managerId ? nodes.get(node.managerId) : undefined;
    if (manager) {
      manager.children.push(node);
    } else {
      roots.push(node);
    }
  }

  for (const node of nodes.values()) {
    node.children.sort(byName);
  }
  roots.sort(byName);

  return roots;
}
