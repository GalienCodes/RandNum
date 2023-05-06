from pyteal import *
import json


@ABIReturnSubroutine
def generate_lucky_number(application_Id: abi.Application, *, output: abi.Uint64):
    # That block number is the reference point to get the most latest
    most_recent_saved_block_difference = Global.round()-Int(24908202)
    most_recent_saved_block_modulo = most_recent_saved_block_difference % Int(
        8)
    most_recent_saved_block = Int(
        24908202) + most_recent_saved_block_difference-most_recent_saved_block_modulo-Int(16)
    return Seq(
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.ApplicationCall,
                TxnField.application_id:  application_Id.application_id(),
                TxnField.on_completion: OnComplete.NoOp,
                TxnField.application_args: [MethodSignature(
                    "get(uint64,byte[])byte[]"), Itob(most_recent_saved_block), Bytes("Hello")]
            }
        ),
        InnerTxnBuilder.Submit(),
        output.set(Btoi(Extract(InnerTxn.last_log(), Int(12), Int(4))))
    )


@ABIReturnSubroutine
def get_latest_multiple(*, output: abi.Uint64):
    most_recent_saved_block_difference = Global.round()-Int(24908202)
    most_recent_saved_block_modulo = most_recent_saved_block_difference % Int(
        8)
    most_recent_saved_block = Int(
        24908202) + most_recent_saved_block_difference-most_recent_saved_block_modulo-Int(16)
    return Seq(

        output.set(most_recent_saved_block)
    )


@ABIReturnSubroutine
def check_hash(string: abi.String, *, output: abi.Uint64):
    return Seq(
        output.set(Btoi(string.get()))
    )


router = Router(
    name="Lotto",
    bare_calls=BareCallActions(
        no_op=OnCompleteAction(
            action=Approve(), call_config=CallConfig.CREATE
        ),
        opt_in=OnCompleteAction(
            action=Reject(), call_config=CallConfig.CALL
        ),
        clear_state=OnCompleteAction(
            action=Reject(), call_config=CallConfig.CALL
        ),
        close_out=OnCompleteAction(
            action=Reject(), call_config=CallConfig.CALL
        ),
        # Prevent updating and deleting of this application
        update_application=OnCompleteAction(
            action=Reject(), call_config=CallConfig.CALL
        ),
        delete_application=OnCompleteAction(
            action=Reject(), call_config=CallConfig.CALL
        ),

    )
)

router.add_method_handler(generate_lucky_number)
router.add_method_handler(get_latest_multiple)
router.add_method_handler(check_hash)
approval_program, clear_state_program, contract = router.compile_program(
    version=7, optimize=OptimizeOptions(scratch_slots=True)
)


with open("contracts/app.teal", "w") as f:
    f.write(approval_program)

with open("contracts/clear.teal", "w") as f:
    f.write(clear_state_program)


with open("contracts/contract.json", "w") as f:
    f.write(json.dumps(contract.dictify(), indent=4))


if __name__ == "__main__":
    print(approval_program)
