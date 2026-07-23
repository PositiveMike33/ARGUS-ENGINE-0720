const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldGrid = `                    <div className="md:col-span-2 lg:col-span-3">
                      <GoogleFormsIntegration
                        user={user}
                        formsToken={gmailToken}
                        onTokenUpdate={setGmailToken}
                      />
                    </div>
                  </motion.div>
                ) : (`;

const newGrid = `                    <GoogleFormsIntegration
                      user={user}
                      formsToken={gmailToken}
                      onTokenUpdate={setGmailToken}
                    />
                    <GoogleTasksIntegration
                      user={user}
                      tasksToken={gmailToken}
                    />
                    <GoogleSlidesIntegration
                      user={user}
                      slidesToken={gmailToken}
                    />
                    <GoogleDocsIntegration
                      user={user}
                      docsToken={gmailToken}
                    />
                  </motion.div>
                ) : (`;

code = code.replace(oldGrid, newGrid);

fs.writeFileSync('src/App.tsx', code);
console.log('Grid patched');
