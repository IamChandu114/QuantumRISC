`timescale 1ns / 1ps

module branch_unit_tb;

logic Branch;
logic Jump;
logic Zero;

logic [31:0] pc;
logic [31:0] immediate;
logic [31:0] next_pc;

branch_unit dut(
    .Branch(Branch),
    .Jump(Jump),
    .Zero(Zero),
    .pc(pc),
    .immediate(immediate),
    .next_pc(next_pc)
);

initial begin

    $display("------------------------------");
    $display("Branch Unit Test");
    $display("------------------------------");

    // Normal execution
    Branch = 0;
    Jump = 0;
    Zero = 0;
    pc = 32'd100;
    immediate = 32'd16;
    #10;

    if(next_pc == 32'd104)
        $display("[PASS] Sequential PC");

    // Branch taken
    Branch = 1;
    Jump = 0;
    Zero = 1;
    #10;

    if(next_pc == 32'd116)
        $display("[PASS] Branch Taken");

    // Jump
    Branch = 0;
    Jump = 1;
    Zero = 0;
    #10;

    if(next_pc == 32'd116)
        $display("[PASS] Jump");

    $display("------------------------------");

    $finish;

end

endmodule