const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const [workspaceTab, setWorkspaceTab] = useState<'gmail' | 'calendar' | 'drive' | 'sheets' | 'keep' | 'forms' | 'grid'>('grid');",
  "const [workspaceTab, setWorkspaceTab] = useState<'gmail' | 'calendar' | 'drive' | 'sheets' | 'keep' | 'forms' | 'tasks' | 'slides' | 'docs' | 'grid'>('grid');"
);

const oldTabs = `                  {([
                    { key: 'grid', label: 'VUE GRILLE', icon: Grid },
                    { key: 'gmail', label: 'GMAIL', icon: Mail },
                    { key: 'calendar', label: 'CALENDAR', icon: Calendar },
                    { key: 'drive', label: 'DRIVE', icon: Folder },
                    { key: 'sheets', label: 'SHEETS', icon: FileSpreadsheet },
                    { key: 'keep', label: 'KEEP', icon: BookOpen },
                    { key: 'forms', label: 'FORMS', icon: FileText }
                  ] as const).map((tab) => {`;

const newTabs = `                  {([
                    { key: 'grid', label: 'VUE GRILLE', icon: Grid },
                    { key: 'gmail', label: 'GMAIL', icon: Mail },
                    { key: 'calendar', label: 'CALENDAR', icon: Calendar },
                    { key: 'drive', label: 'DRIVE', icon: Folder },
                    { key: 'sheets', label: 'SHEETS', icon: FileSpreadsheet },
                    { key: 'keep', label: 'KEEP', icon: BookOpen },
                    { key: 'tasks', label: 'TASKS', icon: CheckSquare },
                    { key: 'slides', label: 'SLIDES', icon: FileText },
                    { key: 'docs', label: 'DOCS', icon: FileText },
                    { key: 'forms', label: 'FORMS', icon: FileText }
                  ] as const).map((tab) => {`;

code = code.replace(oldTabs, newTabs);

const oldTabViews = `                    {workspaceTab === 'forms' && (
                      <GoogleFormsIntegration
                        user={user}
                        formsToken={gmailToken}
                        onTokenUpdate={setGmailToken}
                      />
                    )}`;

const newTabViews = `                    {workspaceTab === 'forms' && (
                      <GoogleFormsIntegration
                        user={user}
                        formsToken={gmailToken}
                        onTokenUpdate={setGmailToken}
                      />
                    )}
                    {workspaceTab === 'tasks' && (
                      <GoogleTasksIntegration
                        user={user}
                        tasksToken={gmailToken}
                      />
                    )}
                    {workspaceTab === 'slides' && (
                      <GoogleSlidesIntegration
                        user={user}
                        slidesToken={gmailToken}
                      />
                    )}
                    {workspaceTab === 'docs' && (
                      <GoogleDocsIntegration
                        user={user}
                        docsToken={gmailToken}
                      />
                    )}`;

code = code.replace(oldTabViews, newTabViews);

fs.writeFileSync('src/App.tsx', code);
console.log('Done patch');
