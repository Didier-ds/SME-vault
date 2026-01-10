/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/sme_vault.json`.
 */
export type SmeVault = {
  "address": "A5nASa3jpqhhpSLmqWayd4GnW8RRe38LCncz5GZmT4Mi",
  "metadata": {
    "name": "smeVault",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addApprover",
      "discriminator": [
        213,
        245,
        135,
        79,
        129,
        129,
        22,
        80
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.owner",
                "account": "vault"
              },
              {
                "kind": "account",
                "path": "vault.name",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "vault"
          ]
        }
      ],
      "args": [
        {
          "name": "approver",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "addStaff",
      "discriminator": [
        193,
        22,
        157,
        102,
        182,
        180,
        167,
        123
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.owner",
                "account": "vault"
              },
              {
                "kind": "account",
                "path": "vault.name",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "vault"
          ]
        }
      ],
      "args": [
        {
          "name": "staff",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "approveWithdrawal",
      "discriminator": [
        75,
        48,
        146,
        122,
        201,
        158,
        210,
        123
      ],
      "accounts": [
        {
          "name": "withdrawal",
          "writable": true
        },
        {
          "name": "vault"
        },
        {
          "name": "approver",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "createVault",
      "discriminator": [
        29,
        237,
        247,
        208,
        193,
        82,
        54,
        135
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "name"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "approvalThreshold",
          "type": "u8"
        },
        {
          "name": "dailyLimit",
          "type": "u64"
        },
        {
          "name": "txLimit",
          "type": "u64"
        },
        {
          "name": "largeWithdrawalThreshold",
          "type": "u64"
        },
        {
          "name": "delayHours",
          "type": "u64"
        }
      ]
    },
    {
      "name": "executeWithdrawal",
      "discriminator": [
        113,
        121,
        203,
        232,
        137,
        139,
        248,
        249
      ],
      "accounts": [
        {
          "name": "withdrawal",
          "writable": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.owner",
                "account": "vault"
              },
              {
                "kind": "account",
                "path": "vault.name",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "vaultTokenAccount",
          "docs": [
            "Vault's token account (source of funds)"
          ],
          "writable": true
        },
        {
          "name": "destinationTokenAccount",
          "docs": [
            "Destination token account (where tokens go)"
          ],
          "writable": true
        },
        {
          "name": "vaultAuthority"
        },
        {
          "name": "tokenProgram",
          "docs": [
            "SPL Token Program"
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "executor",
          "docs": [
            "Person executing (anyone can execute, just pays gas)"
          ],
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [],
      "args": []
    },
    {
      "name": "removeApprover",
      "discriminator": [
        214,
        72,
        133,
        48,
        50,
        58,
        227,
        224
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.owner",
                "account": "vault"
              },
              {
                "kind": "account",
                "path": "vault.name",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "vault"
          ]
        }
      ],
      "args": [
        {
          "name": "approver",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "removeStaff",
      "discriminator": [
        91,
        158,
        191,
        242,
        12,
        55,
        167,
        27
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.owner",
                "account": "vault"
              },
              {
                "kind": "account",
                "path": "vault.name",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "vault"
          ]
        }
      ],
      "args": [
        {
          "name": "staff",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "requestWithdrawal",
      "discriminator": [
        251,
        85,
        121,
        205,
        56,
        201,
        12,
        177
      ],
      "accounts": [
        {
          "name": "withdrawal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  105,
                  116,
                  104,
                  100,
                  114,
                  97,
                  119,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "vault.withdrawal_count",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.owner",
                "account": "vault"
              },
              {
                "kind": "account",
                "path": "vault.name",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "requester",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "destination",
          "type": "pubkey"
        },
        {
          "name": "reason",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    },
    {
      "name": "withdrawalRequest",
      "discriminator": [
        242,
        88,
        147,
        173,
        182,
        62,
        229,
        193
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidName",
      "msg": "Invalid name: Name must be between 1 and 50 characters"
    },
    {
      "code": 6001,
      "name": "invalidThreshold",
      "msg": "Invalid threshold: Threshold must be > 0 and <= number of approvers"
    },
    {
      "code": 6002,
      "name": "invalidLimit",
      "msg": "Invalid limit: Limit must be greater than 0"
    },
    {
      "code": 6003,
      "name": "unauthorized",
      "msg": "Unauthorized: You are not authorized to perform this action"
    },
    {
      "code": 6004,
      "name": "maxApproversReached",
      "msg": "Max approvers reached: Cannot add more than 10 approvers"
    },
    {
      "code": 6005,
      "name": "duplicateApprover",
      "msg": "Duplicate approver: Approver is already in the list"
    },
    {
      "code": 6006,
      "name": "approverNotFound",
      "msg": "Approver not found"
    },
    {
      "code": 6007,
      "name": "maxStaffReached",
      "msg": "Max staff reached: Cannot add more than 20 staff members"
    },
    {
      "code": 6008,
      "name": "duplicateStaff",
      "msg": "Duplicate staff: Staff member is already in the list"
    },
    {
      "code": 6009,
      "name": "staffNotFound",
      "msg": "Staff not found"
    },
    {
      "code": 6010,
      "name": "vaultFrozen",
      "msg": "Vault is frozen: Cannot perform this action while vault is frozen"
    },
    {
      "code": 6011,
      "name": "exceedsLimit",
      "msg": "Exceeds limit: Amount exceeds configured transaction limit"
    },
    {
      "code": 6012,
      "name": "invalidStatus",
      "msg": "Invalid status: Operation not allowed for current withdrawal status"
    },
    {
      "code": 6013,
      "name": "alreadyApproved",
      "msg": "Already approved: This approver has already approved this request"
    },
    {
      "code": 6014,
      "name": "selfApprovalNotAllowed",
      "msg": "Self-approval not allowed: Cannot approve your own withdrawal request"
    },
    {
      "code": 6015,
      "name": "insufficientApprovals",
      "msg": "Insufficient approvals: Not enough approvals to execute withdrawal"
    },
    {
      "code": 6016,
      "name": "delayNotPassed",
      "msg": "Delay not passed: Time delay period has not elapsed yet"
    },
    {
      "code": 6017,
      "name": "insufficientBalance",
      "msg": "Insufficient balance: Vault does not have enough tokens"
    },
    {
      "code": 6018,
      "name": "customError",
      "msg": "Custom error message"
    }
  ],
  "types": [
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "approvers",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "staff",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "approvalThreshold",
            "type": "u8"
          },
          {
            "name": "dailyLimit",
            "type": "u64"
          },
          {
            "name": "txLimit",
            "type": "u64"
          },
          {
            "name": "largeWithdrawalThreshold",
            "type": "u64"
          },
          {
            "name": "delayHours",
            "type": "u64"
          },
          {
            "name": "frozen",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "withdrawalCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "withdrawalRequest",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "destination",
            "type": "pubkey"
          },
          {
            "name": "requester",
            "type": "pubkey"
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "approvals",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "withdrawalStatus"
              }
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "delayUntil",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "executedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "withdrawalStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "approved"
          },
          {
            "name": "executed"
          },
          {
            "name": "rejected"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "vaultSeed",
      "type": "bytes",
      "value": "[118, 97, 117, 108, 116]"
    },
    {
      "name": "withdrawalSeed",
      "type": "bytes",
      "value": "[119, 105, 116, 104, 100, 114, 97, 119, 97, 108]"
    }
  ]
};
